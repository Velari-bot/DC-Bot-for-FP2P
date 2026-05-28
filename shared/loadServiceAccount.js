const fs = require('fs');
const path = require('path');

/**
 * Strip wrapping quotes Railway/users often add around env values.
 */
function stripEnvQuotes(value) {
    if (!value || typeof value !== 'string') return '';
    let v = value.trim();
    while (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
    ) {
        v = v.slice(1, -1).trim();
    }
    return v;
}

/**
 * Normalize PEM private_key after JSON.parse (literal \n, CRLF, stray spaces).
 */
function normalizePrivateKey(privateKey) {
    if (!privateKey || typeof privateKey !== 'string') return privateKey;
    let key = privateKey.trim();
    // JSON may leave literal backslash-n instead of newlines
    key = key.replace(/\\n/g, '\n');
    key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (!key.endsWith('\n')) key += '\n';
    return key;
}

function parseServiceAccountJson(jsonString) {
    const serviceAccount = JSON.parse(jsonString);
    if (serviceAccount.private_key) {
        serviceAccount.private_key = normalizePrivateKey(serviceAccount.private_key);
    }
    return serviceAccount;
}

/**
 * Decode base64; tolerate URL-safe alphabet and missing padding.
 */
function decodeBase64ToUtf8(encoded) {
    let b64 = stripEnvQuotes(encoded).replace(/\s/g, '');
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad) b64 += '='.repeat(4 - pad);
    return Buffer.from(b64, 'base64').toString('utf8');
}

/**
 * Load Firebase service account from env or local file.
 * @returns {object|null}
 */
function loadServiceAccountFromEnv() {
    const saPath = path.resolve(__dirname, '../service-account.json');
    if (fs.existsSync(saPath)) {
        try {
            return parseServiceAccountJson(fs.readFileSync(saPath, 'utf8'));
        } catch (e) {
            console.error('Firebase: failed to read service-account.json:', e.message);
        }
    }

    const saRaw = stripEnvQuotes(process.env.FIREBASE_SERVICE_ACCOUNT || '');
    const saB64 = stripEnvQuotes(process.env.FIREBASE_SERVICE_ACCOUNT_B64 || '');

    if (saRaw) {
        try {
            return parseServiceAccountJson(saRaw);
        } catch (e) {
            console.error('Firebase: FIREBASE_SERVICE_ACCOUNT JSON parse failed:', e.message);
        }
    }

    if (saB64) {
        try {
            const decoded = decodeBase64ToUtf8(saB64);
            return parseServiceAccountJson(decoded);
        } catch (e) {
            console.error('Firebase: FIREBASE_SERVICE_ACCOUNT_B64 decode failed:', e.message);
        }
    }

    return null;
}

module.exports = {
    loadServiceAccountFromEnv,
    normalizePrivateKey,
    stripEnvQuotes,
    decodeBase64ToUtf8,
    parseServiceAccountJson,
};
