const admin = require('firebase-admin');
const { loadServiceAccountFromEnv } = require('./loadServiceAccount');

/**
 * Firebase Admin — supports local file, raw JSON env, or base64 JSON env.
 * Throws on invalid credentials so Railway logs show the real error.
 */
if (!admin.apps.length) {
    const serviceAccount = loadServiceAccountFromEnv();

    if (!serviceAccount?.project_id) {
        const err = new Error(
            'Firebase Admin: no valid service account. Set FIREBASE_SERVICE_ACCOUNT_B64 (no quotes in Railway) or add service-account.json locally.'
        );
        console.error(err.message);
        throw err;
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log(`Firebase Admin initialized for project: ${serviceAccount.project_id}`);
    } catch (error) {
        console.error(
            'Firebase Admin: credential rejected. Regenerate the service account key in Firebase Console, then re-encode:',
            'node scripts/encode-service-account.js path/to/key.json'
        );
        throw error;
    }
}

module.exports = admin;
