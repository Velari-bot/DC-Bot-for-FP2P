const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

/**
 * Robust Firebase Admin Initialization
 * Handles both raw JSON and Base64 encoded service accounts.
 */
if (!admin.apps.length) {
    try {
        let serviceAccount = null;
        const sa_path = path.resolve(__dirname, '../../fp2p-bcd48-firebase-adminsdk-fbsvc-e1b437bed5.json');

        if (fs.existsSync(sa_path)) {
            try {
                serviceAccount = JSON.parse(fs.readFileSync(sa_path, 'utf8'));
                console.log("Firebase Admin: Using local service account file");
            } catch (e) {
                console.error("Firebase Admin: Failed to read local SA file:", e.message);
            }
        }

        if (!serviceAccount) {
            const sa_raw = process.env.FIREBASE_SERVICE_ACCOUNT;
            const sa_b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

            if (sa_raw && sa_raw.trim()) {
                try {
                    serviceAccount = JSON.parse(sa_raw.trim());
                } catch (e) {
                    console.error("Firebase Admin: Failed to parse raw service account:", e.message);
                }
            } else if (sa_b64 && sa_b64.trim()) {
                try {
                    const decoded = Buffer.from(sa_b64.trim(), 'base64').toString('utf8');
                    serviceAccount = JSON.parse(decoded);
                } catch (e) {
                    console.error("Firebase Admin: Failed to parse Base64 service account:", e.message);
                }
            }
        }

        if (serviceAccount && serviceAccount.project_id) {
            // Fix for literal \n in private key
            if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log(`Firebase Admin initialized for project: ${serviceAccount.project_id}`);
        } else {
            console.error("Firebase Admin: No valid service account found. Environment check:", {
                has_raw: !!process.env.FIREBASE_SERVICE_ACCOUNT,
                has_b64: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
                has_file: fs.existsSync(sa_path),
                node_env: process.env.NODE_ENV
            });
        }
    } catch (error) {
        console.error("Firebase Admin: Initialization failed with error:", error);
    }
}

module.exports = admin;
