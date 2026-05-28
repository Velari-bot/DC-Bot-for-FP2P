#!/usr/bin/env node
/**
 * Encode a Firebase service account JSON file for Railway FIREBASE_SERVICE_ACCOUNT_B64.
 *
 * Usage:
 *   node scripts/encode-service-account.js path/to/service-account.json
 *
 * Paste the single-line output into Railway (no surrounding quotes).
 */
const fs = require('fs');
const path = require('path');
const { parseServiceAccountJson } = require('../shared/loadServiceAccount');

const file = process.argv[2];
if (!file) {
    console.error('Usage: node scripts/encode-service-account.js <service-account.json>');
    process.exit(1);
}

const abs = path.resolve(file);
const raw = fs.readFileSync(abs, 'utf8');
// Validate JSON + private key shape before encoding
const sa = parseServiceAccountJson(raw);
if (!sa.project_id || !sa.private_key?.includes('BEGIN PRIVATE KEY')) {
    console.error('Invalid service account file');
    process.exit(1);
}

// Re-stringify compact so private_key uses standard JSON \n escapes
const compact = JSON.stringify(sa);
const b64 = Buffer.from(compact, 'utf8').toString('base64');

console.log('\n--- FIREBASE_SERVICE_ACCOUNT_B64 (paste into Railway, NO quotes) ---\n');
console.log(b64);
console.log('\n--- end ---\n');
