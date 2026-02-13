const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();

async function check() {
    const snap = await db.collection('courses').get();
    snap.forEach(doc => {
        console.log(`ID: ${doc.id} | Title: ${doc.data().title}`);
    });
    process.exit(0);
}
check();
