const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();

async function checkDiscord() {
    const email = "uno0fortnite@gmail.com";
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            console.log(`Discord ID: ${data.discordId || 'None'}`);
            console.log(`Podia ID: ${data.podiaId || 'None'}`);
        }
    } catch (e) {
        console.error(e);
    }
}
checkDiscord();
