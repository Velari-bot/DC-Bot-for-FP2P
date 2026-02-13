const Stripe = require('stripe');
const admin = require('./utils/firebaseAdmin');

const db = admin.firestore();
const secretKey = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.replace(/"/g, '').trim() : "";
const stripe = Stripe(secretKey);

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        console.log(`Syncing purchases for ${email}...`);

        // 1. Find Stripe Customer(s) by email
        const customers = await stripe.customers.list({ email: email, limit: 1 });
        if (customers.data.length === 0) {
            return res.json({ message: "No Stripe customer found for this email.", count: 0 });
        }
        const customer = customers.data[0];

        // 2. List Checkout Sessions (Succeeded)
        const sessions = await stripe.checkout.sessions.list({
            customer: customer.id,
            status: 'complete',
            limit: 100 // Reasonable limit
        });

        let syncedCount = 0;
        let userId = null;

        // Get User ID from Auth
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            userId = userRecord.uid;
        } catch (e) {
            console.log("User not found in Auth, syncing to Unclaimed.");
        }

        const batch = db.batch();

        for (const session of sessions.data) {
            // Reconstruct product info from metadata or session
            const metadata = session.metadata || {};
            const productId = metadata.productId || "unknown";
            // For courses, we usually have metadata. For ad-hoc, use amount

            // Check if payment already exists
            let paymentRef;
            if (userId) {
                paymentRef = db.collection('users').doc(userId).collection('payments').doc(session.id);
            } else {
                paymentRef = db.collection('unclaimed_purchases').doc(email).collection('history').doc(session.id);
            }

            const docSnap = await paymentRef.get();
            if (!docSnap.exists) {
                // Determine details
                let productName = "Unknown Item";
                let isCourse = metadata.type === "course";
                let creditsToAdd = 0;

                // Expand Line Items if needed, but session object usually has amount_total
                // To get product name, we might need to expand line_items in the list call or separate call
                // Optimization: just use metadata or generic fallback

                if (isCourse) {
                    productName = metadata.requiredProductId || productId; // Ideally the name
                    // Fetch line items to get real name
                    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });
                    productName = expandedSession.line_items?.data[0]?.description || productName;
                } else {
                    const expandedSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });
                    productName = expandedSession.line_items?.data[0]?.description || "Coaching Session";

                    if (productName.includes('Session')) creditsToAdd = 1; // Basic logic
                    if (productName.includes('3 Hour')) creditsToAdd = 3;
                    if (productName.includes('5 Hour')) creditsToAdd = 5;
                }

                const paymentData = {
                    date: new Date(session.created * 1000).toISOString(),
                    item: productName,
                    productId: productId,
                    amount: (session.amount_total / 100).toFixed(2),
                    credits: creditsToAdd,
                    currency: session.currency.toUpperCase(),
                    stripeSessionId: session.id,
                    email: email,
                    type: isCourse ? "course" : "coaching",
                    syncedAt: new Date().toISOString()
                };

                batch.set(paymentRef, paymentData);

                // Update User Credits if needed
                if (creditsToAdd > 0 && userId) {
                    const userRef = db.collection('users').doc(userId);
                    // We can't increment inside a batch easily without reading, but we are just syncing.
                    // Let's assume the user might allow overwriting or we handle it separately.
                    // For safety, let's just record the payment history. 
                    // Credits logic is complex in sync. Let's skip auto-credit-add for sync to avoid duplicates 
                    // UNLESS we are sure.
                    // Actually, if it's missing from history, it wasn't processed.
                    // But dealing with `credits` increment in a batch requires a Transaction.
                    // We will just save the payment record for Entitlement checks (e.g. My Courses).
                }
                syncedCount++;
            }
        }

        if (syncedCount > 0) {
            await batch.commit();
        }

        return res.json({
            success: true,
            message: `Synced ${syncedCount} purchases.`,
            syncedCount
        });

    } catch (e) {
        console.error("Sync Error:", e);
        return res.status(500).json({ error: e.message });
    }
};
