const admin = require('./utils/firebaseAdmin');
const db = admin.firestore();

// Admin User Emails (Server-side validation)
const ADMIN_EMAILS = ["benderaden826@gmail.com", "bender.adrian@gmail.com", "flamefrags@gmail.com", "benderaiden826@gmail.com"];

module.exports = async (req, res) => {
    const { action } = req.query;

    // Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const idToken = authHeader.split('Bearer ')[1];

    let email;
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        email = decodedToken.email;
        if (!ADMIN_EMAILS.includes(email)) {
            return res.status(403).json({ error: 'Access Denied: You are not an admin.' });
        }
    } catch (e) {
        return res.status(401).json({ error: 'Invalid Session' });
    }

    if (req.method === 'POST') {
        if (action === 'grant') {
            const { targetEmail, courseId, durationValue, durationUnit, reason } = req.body;

            if (!targetEmail || !courseId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Find User ID
            let userId;
            try {
                const userRecord = await admin.auth().getUserByEmail(targetEmail);
                userId = userRecord.uid;
            } catch (e) {
                return res.status(404).json({ error: `User with email ${targetEmail} not found in system.` });
            }

            // Determine Expiration
            let expiresAt = null;
            const now = new Date();
            let expiryDate = new Date();

            if (durationUnit === 'forever') {
                expiresAt = null;
            } else {
                const val = parseInt(durationValue, 10);
                if (isNaN(val) || val <= 0) return res.status(400).json({ error: 'Invalid duration value' });

                if (durationUnit === 'days') expiryDate.setDate(expiryDate.getDate() + val);
                else if (durationUnit === 'weeks') expiryDate.setDate(expiryDate.getDate() + (val * 7));
                else if (durationUnit === 'months') expiryDate.setMonth(expiryDate.getMonth() + val);
                else if (durationUnit === 'years') expiryDate.setFullYear(expiryDate.getFullYear() + val);

                expiresAt = expiryDate.toISOString();
            }

            // Fetch Course Title for metadata
            let courseTitle = courseId;
            try {
                const cDoc = await db.collection('courses').doc(courseId).get();
                if (cDoc.exists) courseTitle = cDoc.data().title;
            } catch (e) { /* ignore */ }

            // Create "Fake" Payment Record
            const paymentId = `admin_grant_${now.getTime()}`;
            const paymentData = {
                date: now.toISOString(),
                item: `Admin Grant: ${courseTitle}`,
                productId: courseId,
                amount: '0.00',
                credits: 0,
                stripeSessionId: paymentId,
                email: targetEmail,
                type: 'course',
                adminGrant: true,
                grantedBy: email,
                reason: reason || 'Manual Admin Access',
                expiresAt: expiresAt
            };

            try {
                // Add to user's payments subcollection
                await db.collection('users').doc(userId).collection('payments').doc(paymentId).set(paymentData);

                // Add to Audit Log
                await db.collection('admin_logs').add({
                    action: 'grant_access',
                    adminEmail: email,
                    targetEmail: targetEmail,
                    courseId: courseId,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    details: paymentData
                });

                return res.json({ success: true, message: `Access granted to ${targetEmail} for ${courseTitle}`, expiresAt });
            } catch (e) {
                console.error("Grant Error", e);
                return res.status(500).json({ error: 'Database write failed' });
            }
        }

        if (action === 'update-metrics') {
            const { targetEmail, powerRanking, earnings, followers } = req.body;

            if (!targetEmail) {
                return res.status(400).json({ error: 'Target email is required' });
            }

            try {
                const userRecord = await admin.auth().getUserByEmail(targetEmail);
                const userId = userRecord.uid;

                const updates = {};
                if (powerRanking !== undefined) updates.powerRanking = parseInt(powerRanking) || 0;
                if (earnings !== undefined) updates.earnings = parseFloat(earnings) || 0;
                if (followers !== undefined) updates.followers = parseInt(followers) || 0;
                updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

                await db.collection('users').doc(userId).set(updates, { merge: true });

                // Log the action
                await db.collection('admin_logs').add({
                    action: 'update_metrics',
                    adminEmail: email,
                    targetEmail: targetEmail,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    details: updates
                });

                return res.json({ success: true, message: `Metrics updated for ${targetEmail}` });
            } catch (e) {
                console.error("Update Metrics Error", e);
                return res.status(500).json({ error: e.message || 'Failed to update user metrics' });
            }
        }
    }

    if (req.method === 'GET') {
        if (action === 'analytics') {
            try {
                // 1. Get Course Sales
                // Using collectionGroup if possible, or fallback to scanning users
                // Note: collectionGroup requires an index. 
                let allPayments = [];

                try {
                    const paymentsSnap = await db.collectionGroup('payments').get();
                    allPayments = paymentsSnap.docs.map(doc => doc.data());
                } catch (err) {
                    console.log("Collection Group query failed (missing index?), falling back to scan...");
                    const usersSnap = await db.collection('users').get();
                    for (const userDoc of usersSnap.docs) {
                        const pSnap = await userDoc.ref.collection('payments').get();
                        pSnap.docs.forEach(d => allPayments.push(d.data()));
                    }
                }

                // Also include unclaimed purchases
                const unclaimedSnap = await db.collection('unclaimed_purchases').get();
                for (const uDoc of unclaimedSnap.docs) {
                    const hSnap = await uDoc.ref.collection('history').get();
                    hSnap.docs.forEach(d => allPayments.push(d.data()));
                }

                // Process Sales Data
                const salesByCourse = {};
                const revenueByMonth = {};

                allPayments.forEach(p => {
                    if (p.type === 'course') {
                        const courseId = p.productId || 'unknown';
                        const courseName = p.item || 'Unknown Course';
                        if (!salesByCourse[courseId]) {
                            salesByCourse[courseId] = { id: courseId, name: courseName, sales: 0, revenue: 0 };
                        }
                        salesByCourse[courseId].sales += 1;
                        salesByCourse[courseId].revenue += parseFloat(p.amount || 0);
                    }

                    const date = p.date ? new Date(p.date) : new Date();
                    const monthKey = date.toISOString().substring(0, 7);
                    revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + parseFloat(p.amount || 0);
                });

                // 2. Get Video Analytics
                const videoSnap = await db.collection('video_analytics').get();
                const videoStats = videoSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0));

                // 3. Get Site Analytics (Monthly Totals)
                const siteSnap = await db.collection('site_analytics').doc('video_stats').get();
                const siteStats = siteSnap.exists ? siteSnap.data() : { monthlyTotal: {} };

                return res.json({
                    salesByCourse: Object.values(salesByCourse),
                    revenueByMonth,
                    topVideos: videoStats.slice(0, 10),
                    monthlyVideoViews: siteStats.monthlyTotal
                });

            } catch (err) {
                console.error("Analytics Error:", err);
                return res.status(500).json({ error: err.message });
            }
        }

        if (action === 'get-user') {
            const { targetEmail } = req.query;
            if (!targetEmail) return res.status(400).json({ error: 'Target email required' });

            try {
                const userRecord = await admin.auth().getUserByEmail(targetEmail);
                const userId = userRecord.uid;

                const userDoc = await db.collection('users').doc(userId).get();
                const userData = userDoc.exists ? userDoc.data() : {};

                return res.json({
                    uid: userId,
                    email: targetEmail,
                    powerRanking: userData.powerRanking || 0,
                    earnings: userData.earnings || 0,
                    followers: userData.followers || 0
                });
            } catch (e) {
                return res.status(404).json({ error: 'User not found in system' });
            }
        }
    }

    return res.status(400).json({ error: 'Invalid Action' });
};
