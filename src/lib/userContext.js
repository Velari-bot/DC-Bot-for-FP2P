const admin = require('../../shared/firebaseAdmin');

const db = admin.firestore();

async function findUidByDiscordId(discordId) {
    const snap = await db.collection('users').where('discordId', '==', discordId).limit(1).get();
    if (snap.empty) return null;
    return snap.docs[0].id;
}

async function getUserContext(discordId) {
    const snap = await db.collection('users').where('discordId', '==', discordId).limit(1).get();
    if (snap.empty) return null;

    const doc = snap.docs[0];
    const uid = doc.id;
    const userData = doc.data();
    const paymentsSnap = await db.collection('users').doc(uid).collection('payments').get();
    const payments = paymentsSnap.docs.map((d) => d.data());

    return { uid, userData, payments };
}

module.exports = { findUidByDiscordId, getUserContext, db };
