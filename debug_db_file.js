const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();
const fs = require('fs');

async function debug() {
    let output = "";
    try {
        const snap = await db.collection('courses').get();
        output += `Found ${snap.size} courses\n`;
        snap.forEach(doc => {
            output += `ID: ${doc.id}\n`;
            output += `Title: ${doc.data().title}\n`;
            output += `MarketingURL: ${doc.data().marketingUrl}\n`;
            output += `PriceID: ${doc.data().monthlyPriceId || doc.data().priceId}\n`;
            output += `---\n`;
        });
        fs.writeFileSync('db_debug_output.txt', output);
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('db_debug_output.txt', err.stack);
        process.exit(1);
    }
}
debug();
