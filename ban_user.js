const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();

async function banUser() {
    const email = "uno0fortnite@gmail.com";
    console.log(`Banning user: ${email}`);

    try {
        // 1. Get User from Auth
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;
        console.log(`User UID: ${uid}`);

        // 2. Disable Account in Firebase Auth
        await admin.auth().updateUser(uid, { disabled: true });
        console.log(`✅ Account disabled in Firebase Auth.`);

        // 3. Revoke all Masterclass access in Firestore
        const paymentsSnap = await db.collection('users').doc(uid).collection('payments').get();
        const batch = db.batch();

        paymentsSnap.forEach(doc => {
            console.log(`Revoking access: ${doc.id} (${doc.data().item})`);
            // Either delete or expire
            batch.update(doc.ref, {
                expiresAt: new Date(0).toISOString(),
                revokedAt: new Date().toISOString(),
                revokedReason: "Banned by Admin"
            });
        });

        // 4. Mark as banned in user document
        batch.set(db.collection('users').doc(uid), { banned: true, bannedAt: new Date().toISOString() }, { merge: true });

        // 5. Add to admin logs
        const logRef = db.collection('admin_logs').doc();
        batch.set(logRef, {
            action: 'ban_user',
            targetEmail: email,
            targetUid: uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            reason: "User specifically requested to be banned/revoked"
        });

        await batch.commit();
        console.log(`✅ Firestore access revoked and user marked as banned.`);

    } catch (err) {
        console.error("Ban failed:", err);
    }
}

banUser();
