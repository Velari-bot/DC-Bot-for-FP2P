#!/usr/bin/env node
/** Quick check: FIREBASE_SERVICE_ACCOUNT_B64 parses and firebase-admin accepts the key */
const admin = require('firebase-admin');
const { loadServiceAccountFromEnv } = require('../shared/loadServiceAccount');

const sa = loadServiceAccountFromEnv();
if (!sa) {
    console.error('FAIL: no service account from env');
    process.exit(1);
}
console.log('project_id:', sa.project_id);
try {
    admin.credential.cert(sa);
    console.log('OK: credential.cert accepted');
    process.exit(0);
} catch (e) {
    console.error('FAIL:', e.message);
    process.exit(1);
}
