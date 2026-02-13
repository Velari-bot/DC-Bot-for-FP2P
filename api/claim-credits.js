const admin = require('./utils/firebaseAdmin');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { idToken } = req.body;

    if (!idToken) {
        return res.status(401).json({ message: 'Missing ID Token' });
    }

    try {
        if (!admin.apps.length) {
            return res.status(503).json({ message: 'Firebase Admin not initialized' });
        }

        // Verify the ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        if (!email) {
            return res.status(400).json({ message: 'User has no email' });
        }

        const db = admin.firestore();
        const unclaimedRef = db.collection('unclaimed_purchases').doc(email);
        const userRef = db.collection('users').doc(uid);

        let claimedCredits = 0;

        await db.runTransaction(async (t) => {
            const unclaimedDoc = await t.get(unclaimedRef);
            if (!unclaimedDoc.exists) {
                return; // Nothing to claim
            }

            const unclaimedData = unclaimedDoc.data();
            claimedCredits = unclaimedData.credits || 0;

            if (claimedCredits > 0) {
                // Get current user credits
                const userDoc = await t.get(userRef);
                const currentCredits = userDoc.exists ? (userDoc.data().credits || 0) : 0;

                // Update user credits
                t.set(userRef, {
                    credits: currentCredits + claimedCredits,
                    email: email
                }, { merge: true });

                // Move history
                const historySnapshot = await unclaimedRef.collection('history').get();
                historySnapshot.forEach(doc => {
                    t.set(userRef.collection('payments').doc(doc.id), doc.data());
                });

                // Delete unclaimed doc
                t.delete(unclaimedRef);
                // Note: Subcollections need to be deleted recursively in Firestore usually, 
                // but since we moved the data we might just leave them or let them be orphaned 
                // (or delete them if we had a recursive delete helper). 
                // For now, deleting the parent doc is enough to "hide" it, 
                // but strictly speaking the subcollection remains.
                // We will iterate and delete the history docs too.
                historySnapshot.forEach(doc => {
                    t.delete(unclaimedRef.collection('history').doc(doc.id));
                });
            }
        });

        return res.json({
            success: true,
            claimed: claimedCredits,
            message: claimedCredits > 0 ? `Successfully claimed ${claimedCredits} credits.` : "No new credits found."
        });

    } catch (error) {
        console.error("Claim Credits Error:", error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
