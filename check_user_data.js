const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();

async function checkDiscord() {
    const email = "uno0fortnite@gmail.com";
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            console.log("Firestore User Data:");
            console.log(userDoc.data());
        }
    } catch (e) {
        console.error(e);
    }
}
checkDiscord();
