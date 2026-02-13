const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();

async function listEverything() {
    try {
        console.log("--- COURSES ---");
        const courseSnap = await db.collection('courses').get();
        courseSnap.forEach(doc => {
            const d = doc.data();
            console.log(`ID: ${doc.id}`);
            console.log(`Title: ${d.title}`);
            console.log(`Marketing URL: ${d.marketingUrl}`);
            console.log(`MonthlyPriceId: ${d.monthlyPriceId || d.priceId}`);
            console.log(`---`);
        });

        console.log("\n--- MAPPINGS ---");
        const mapSnap = await db.collection('site_settings').doc('mappings').get();
        if (mapSnap.exists()) {
            console.log(JSON.stringify(mapSnap.data(), null, 2));
        } else {
            console.log("No mappings found.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listEverything();
