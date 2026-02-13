const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();

async function listCourses() {
    try {
        const snap = await db.collection('courses').get();
        console.log("Found", snap.size, "courses:");
        snap.forEach(doc => {
            const data = doc.data();
            console.log(`- ID: ${doc.id}`);
            console.log(`  Title: ${data.title}`);
            console.log(`  Marketing URL: ${data.marketingUrl}`);
            console.log(`  Required Product ID: ${data.requiredProductId}`);
            console.log('---');
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listCourses();
