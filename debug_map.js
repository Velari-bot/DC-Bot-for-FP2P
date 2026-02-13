const admin = require('./api/utils/firebaseAdmin');
const db = admin.firestore();
const fs = require('fs');

async function debug() {
    try {
        const mapDoc = await db.collection('site_settings').doc('mappings').get();
        if (mapDoc.exists()) {
            fs.writeFileSync('map_debug.json', JSON.stringify(mapDoc.data(), null, 2));
        } else {
            fs.writeFileSync('map_debug.json', '{"error": "No mappings document found"}');
        }
    } catch (err) {
        fs.writeFileSync('map_debug.json', err.stack);
    }
    process.exit(0);
}
debug();
