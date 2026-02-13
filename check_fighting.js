const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();

async function checkFighting() {
    try {
        const id = "tO4MriPtFjmoksUbpXdQ";
        const doc = await db.collection('courses').doc(id).get();
        if (doc.exists) {
            console.log("Found Fighting Course:");
            console.log(JSON.stringify(doc.data(), null, 2));
        } else {
            console.log("Fighting Course NOT FOUND by ID:", id);
            const snap = await db.collection('courses').get();
            snap.forEach(d => {
                if (d.data().title.toLowerCase().includes('fighting')) {
                    console.log("Found Match by Title:", d.id, d.data().title);
                }
            });
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

checkFighting();
