const Stripe = require('stripe');
const admin = require('./utils/firebaseAdmin');
const axios = require('axios');
const { assignRole, ROLE_MAPPING } = require('./utils/discordBot');

const db = admin.firestore();

// Body parser handled internally for webhook
const getRawBody = async (req) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
};

const getAppURL = (req) => {
    const headers = req.headers || {};
    const host = headers['x-forwarded-host'] || headers.host;
    let protocol = headers['x-forwarded-proto'] || 'https';
    if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
        protocol = 'http';
    }
    return `${protocol}://${host}`;
};

const products = {
    "single_coaching": { name: "1:1 1 Hour Coaching Session", unit_amount: 15000, images: ["http://fortnitepathtopro.com/pfps/deckzee.png"] },
    "coaching_bundle_3h": { name: "1:1 3 Hour Coaching Bundle", unit_amount: 40000, images: ["http://fortnitepathtopro.com/pfps/deckzee.png"] },
    "coaching_bundle_5h": { name: "1:1 5 Hour Coaching Bundle", unit_amount: 60000, images: ["http://fortnitepathtopro.com/pfps/deckzee.png"] },
    "group_coaching": { name: "Group Coaching Session", unit_amount: 3000, images: ["http://fortnitepathtopro.com/pfps/deckzee.png"] },
    "basic_season": { name: "Basic Seasonal Coaching", priceId: "price_1SuIBpENRiU5OaK0n81PgFoJ", images: ["http://fortnitepathtopro.com/pfps/deckzee.png"] },
    "advanced_season": { name: "Advanced Seasonal Coaching", priceId: "price_1SuICeENRiU5OaK0MEvPAwZy", images: ["http://fortnitepathtopro.com/pfps/deckzee.png"] },
    "vod_review": { name: "Deckzee VOD Reviews", unit_amount: 2000, images: ["http://fortnitepathtopro.com/pfps/deckzee.png"], mode: "subscription" },
    "fighting_1v1_single": { name: "Fighting Masterclass 1v1 Session (Single Mode)", unit_amount: 6000, images: ["http://fortnitepathtopro.com/pfps/deckzee.png"], requiredProductId: "tO4MriPtFjmoksUbpXdQ" },
    "fighting_1v1_double": { name: "Fighting Masterclass 1v1 Session (Double Mode)", unit_amount: 9000, images: ["http://fortnitepathtopro.com/pfps/deckzee.png"], requiredProductId: "tO4MriPtFjmoksUbpXdQ" },
    "fighting_1v1_all": { name: "Fighting Masterclass 1v1 Session (All Modes)", unit_amount: 12500, images: ["http://fortnitepathtopro.com/pfps/deckzee.png"], requiredProductId: "tO4MriPtFjmoksUbpXdQ" }
};

module.exports = async (req, res) => {
    const { action } = req.query;

    // Set secret key with validation
    const rawSecret = process.env.STRIPE_SECRET_KEY;
    if (!rawSecret) {
        console.error("FATAL: STRIPE_SECRET_KEY is missing from environment variables.");
        return res.status(500).json({ message: "Stripe connection not configured." });
    }
    const secretKey = rawSecret.replace(/"/g, '').trim();
    const stripe = Stripe(secretKey);

    if (action === 'checkout') {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

        try {
            // STRICT AUTH ENFORCEMENT
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                console.error("Missing or invalid Authorization header");
                return res.status(401).json({ message: "Unauthorized: Please log in." });
            }

            const idToken = authHeader.split('Bearer ')[1];
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
            } catch (authError) {
                console.error("Token Verification Failed:", authError);
                return res.status(401).json({ message: "Invalid session. Please sign in again." });
            }

            const verifiedEmail = decodedToken.email;

            // Manual body parsing since bodyParser is disabled
            const buf = await getRawBody(req);
            let body = {};
            try {
                if (buf.length > 0) body = JSON.parse(buf.toString());
            } catch (e) {
                console.warn("Could not parse body as JSON", e);
            }

            console.log(`Checkout Action: ${action} | Keys: ${Object.keys(products).join(', ')}`);

            let productId = body.productId || req.query.productId;
            let courseId = body.courseId || req.query.courseId;

            if (productId === 'false') productId = null;
            if (courseId === 'false') courseId = null;

            let product = products[productId] ? { ...products[productId] } : null;
            let metadata = { productId: productId || "course" };

            if (courseId) {
                let courseDoc = await db.collection("courses").doc(courseId).get();

                // Fallback: search by marketingUrl if ID not found
                if (!courseDoc.exists) {
                    const coursesSnap = await db.collection("courses").get();
                    const found = coursesSnap.docs.find(d => {
                        const mUrl = d.data().marketingUrl || "";
                        return mUrl.toLowerCase().includes(courseId.toLowerCase());
                    });
                    if (found) courseDoc = found;
                }

                if (!courseDoc.exists) return res.status(404).json({ message: "Course not found" });
                const courseData = courseDoc.data();
                const billingCycle = body.billingCycle || req.query.billingCycle || 'month';
                let selectedPriceId = (billingCycle === 'year' && courseData.yearlyPriceId) ? courseData.yearlyPriceId : (courseData.monthlyPriceId || courseData.priceId);

                product = {
                    name: courseData.title + (billingCycle === 'year' ? ' (Yearly)' : ''),
                    priceId: selectedPriceId,
                    images: courseData.thumbnail ? [courseData.thumbnail] : ["http://fortnitepathtopro.com/pfps/deckzee.png"],
                    mode: courseData.isOneTime ? "payment" : "subscription"
                };
                metadata = {
                    productId: courseDoc.id,
                    productTitle: courseData.title,
                    type: "course",
                    requiredProductId: (billingCycle === 'year' && courseData.yearlyProductId) ? courseData.yearlyProductId : (courseData.monthlyProductId || courseData.requiredProductId || courseDoc.id)
                };
            }

            if (!product) {
                return res.status(404).json({ message: `Product or Course not found. (ID: ${productId}, Course: ${courseId})` });
            }

            if (product.requiredProductId) {
                metadata.requiredProductId = product.requiredProductId;
            }

            // DYNAMIC PRICING FOR FIGHTING 1V1
            if (productId && productId.startsWith('fighting_1v1') && body.quantity) {
                const qty = parseInt(body.quantity) || 1;
                let total = 0;

                // Pricing Logic: 1st=$50, 2nd=$40, 3rd+=$35 each
                if (qty > 0) {
                    total = 50;
                    if (qty >= 2) total += 40;
                    if (qty >= 3) total += (qty - 2) * 35;
                }

                // Override product details
                product.unit_amount = total * 100; // Convert to cents
                product.name = `Fighting Masterclass 1v1 Session (${qty} Sessions)`;

                // Add gamemode breakdown to name if available
                if (body.gamemodes && Array.isArray(body.gamemodes)) {
                    const modeStr = body.gamemodes.map(m => `${m.quantity} ${m.id}`).join(', ');
                    if (modeStr) product.name += ` - ${modeStr}`;
                }
            }

            const appUrl = getAppURL(req);
            const lineItem = product.priceId ? { price: product.priceId, quantity: 1 } : {
                price_data: {
                    currency: 'usd',
                    product_data: { name: product.name, images: product.images },
                    unit_amount: product.unit_amount,
                    recurring: product.mode === "subscription" ? { interval: "month" } : undefined
                },
                quantity: 1,
            };

            // STRICT: Use verified email from token, ignore body email
            const userEmail = verifiedEmail;
            console.log(`Verified User: ${userEmail} requesting checkout.`);
            const mode = product.mode || 'payment';

            const sessionParams = {
                payment_method_types: ["card"],
                allow_promotion_codes: true,
                customer_email: userEmail,
                line_items: [lineItem],
                mode: mode,
                success_url: `${appUrl}/payment-success?item=${encodeURIComponent(product.name)}&email=${encodeURIComponent(userEmail)}`,
                cancel_url: (courseId || productId === 'fighting_1v1_single' || productId === 'fighting_1v1_double' || productId === 'fighting_1v1_all') ? `${appUrl}/fighting-masterclass` : `${appUrl}/coaching`,
                metadata: metadata,
            };

            if (mode === 'payment') {
                sessionParams.payment_intent_data = { metadata };
            } else if (mode === 'subscription') {
                sessionParams.subscription_data = { metadata };
            }

            const session = await stripe.checkout.sessions.create(sessionParams);
            return res.json({ checkoutUrl: session.url });
        } catch (e) {
            console.error("Checkout Error:", e);
            return res.status(500).json({ message: e.message });
        }
    }

    if (action === 'webhook') {
        const sig = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error("FATAL: STRIPE_WEBHOOK_SECRET is missing.");
            return res.status(500).json({ message: "Webhook not configured." });
        }

        let event;
        try {
            const buf = await getRawBody(req);
            event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
            console.log(`Webhook Event Received: ${event.type}`);
        } catch (err) {
            console.error("Webhook Signature Error:", err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        try {
            if (event.type === "checkout.session.completed") {
                const session = event.data.object;
                const customerEmail = session?.customer_details?.email || session?.customer_email || "Unknown";
                const amountTotal = session?.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";
                const metadata = session?.metadata || {};
                const productId = metadata.productId || "Unknown Product";
                const isCourse = metadata.type === "course";

                let productName = "Unknown Product";
                if (isCourse) {
                    productName = metadata.productTitle || (productId === "course" ? (session.line_items?.[0]?.description || "Course Purchase") : productId);
                } else {
                    productName = products[productId]?.name || productId || "Coaching Purchase";
                }

                console.log(`Processing purchase for ${customerEmail}: ${productName}`);

                let creditsToAdd = productId === 'single_coaching' ? 1 : (productId === 'coaching_bundle_3h' ? 3 : 0);

                try {
                    const auth = admin.auth();
                    let userId = null;
                    try {
                        const userRecord = await auth.getUserByEmail(customerEmail);
                        userId = userRecord.uid;
                    } catch (e) {
                        console.log(`User ${customerEmail} not found in Firebase Auth.`);
                    }

                    const paymentData = {
                        date: new Date().toISOString(),
                        item: productName,
                        productId,
                        requiredProductId: metadata.requiredProductId || null,
                        amount: amountTotal,
                        credits: creditsToAdd,
                        stripeSessionId: session.id,
                        email: customerEmail,
                        type: isCourse ? "course" : "coaching"
                    };

                    if (userId) {
                        const userRef = db.collection('users').doc(userId);
                        await db.runTransaction(async (t) => {
                            const snap = await t.get(userRef);
                            const userData = snap.data() || {};
                            const cur = userData.credits || 0;
                            if (creditsToAdd > 0) t.set(userRef, { credits: cur + creditsToAdd, email: customerEmail }, { merge: true });
                            else t.set(userRef, { email: customerEmail }, { merge: true });
                            t.set(userRef.collection('payments').doc(session.id), paymentData);

                            // Role Assignment
                            if (userData.discordId && ROLE_MAPPING[productId]) {
                                assignRole(userData.discordId, ROLE_MAPPING[productId]).catch(console.error);
                            }
                        });
                    } else {
                        const unclaimedRef = db.collection('unclaimed_purchases').doc(customerEmail);
                        await db.runTransaction(async (t) => {
                            const snap = await t.get(unclaimedRef);
                            const cur = snap.exists ? (snap.data().credits || 0) : 0;
                            if (creditsToAdd > 0) t.set(unclaimedRef, { credits: cur + creditsToAdd, lastUpdated: new Date().toISOString() }, { merge: true });
                            else t.set(unclaimedRef, { lastUpdated: new Date().toISOString() }, { merge: true });
                            t.set(unclaimedRef.collection('history').doc(session.id), paymentData);
                        });
                    }
                    console.log(`Successfully recorded payment for ${customerEmail}`);
                } catch (dbErr) {
                    console.error("Database update error:", dbErr);
                    // We don't necessarily want to return 500 if DB fails but data is logged to console
                    // However, Stripe will retry if we return 500
                    throw dbErr;
                }

                try {
                    await axios.post("https://discord.com/api/webhooks/1465794024412545387/cRODOUOUsHnGaJhJ2prPoqOKI4C1QQ6n7IB8xmDt5ZIyf40EkCBSTK9NhfD3eDuVFBjc", {
                        embeds: [{
                            title: "🎉 New Purchase Verified!",
                            description: `**${customerEmail}** bought **${productName}**!`,
                            color: 0xFACC24,
                            fields: [{ name: "💰 Amount", value: `$${amountTotal}`, inline: true }]
                        }]
                    });
                } catch (discordErr) {
                    console.error("Discord Notification Error:", discordErr.message);
                }
            }
            return res.status(200).json({ received: true });
        } catch (handlerErr) {
            console.error("Webhook Handler Error:", handlerErr);
            return res.status(500).json({ error: handlerErr.message });
        }
    }

    // Customer Billing Portal for subscription management/cancellation
    if (action === 'portal') {
        if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

        try {
            // Verify authentication
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                console.error("Missing or invalid Authorization header for portal");
                return res.status(401).json({ message: "Unauthorized: Please log in." });
            }

            const idToken = authHeader.split('Bearer ')[1];
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
            } catch (authError) {
                console.error("Token Verification Failed:", authError);
                return res.status(401).json({ message: "Invalid session. Please sign in again." });
            }

            const verifiedEmail = decodedToken.email;
            console.log(`Customer Portal requested by: ${verifiedEmail}`);

            // Find or create Stripe customer by email
            const customers = await stripe.customers.list({ email: verifiedEmail, limit: 1 });
            let customerId;

            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
            } else {
                // No existing customer found - they may not have any subscriptions
                return res.status(404).json({
                    message: "No subscription found. You don't have any active subscriptions to manage."
                });
            }

            const appUrl = getAppURL(req);

            // Create billing portal session with specific configuration
            const portalSession = await stripe.billingPortal.sessions.create({
                customer: customerId,
                configuration: 'bpc_1SycQ9ENRiU5OaK0dx9csZPU',
                return_url: `${appUrl}/dashboard`,
            });

            return res.json({ portalUrl: portalSession.url });
        } catch (e) {
            console.error("Portal Error:", e);
            return res.status(500).json({ message: e.message });
        }
    }

    return res.status(400).json({ error: 'Invalid action' });
};

// Essential for Stripe Webhooks on Vercel
module.exports.config = {
    api: {
        bodyParser: false,
    },
};
