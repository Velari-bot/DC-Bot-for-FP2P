const fs = require('fs');
const path = require('path');

try {
    const jsonPath = path.resolve('fp2p-bcd48-firebase-adminsdk-fbsvc-e1b437bed5.json');
    if (!fs.existsSync(jsonPath)) {
        throw new Error("JSON file not found: " + jsonPath);
    }

    // Read and parse to ensure valid JSON
    const saObj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Sanity check private key: ensure it looks like a key
    if (!saObj.private_key || !saObj.private_key.includes('BEGIN PRIVATE KEY')) {
        throw new Error("Invalid private key in JSON");
    }

    // Minify
    const sa_minified = JSON.stringify(saObj);

    // Base64 encode for the environment variable
    const b64 = Buffer.from(sa_minified).toString('base64');

    const envContent = [
        'PORT=3000',
        `FIREBASE_SERVICE_ACCOUNT_B64=${b64}`,
        'R2_ACCOUNT_ID=a22d72c334d2bf7722a6ab6e3300163e',
        'R2_ACCESS_KEY_ID=a99f0fe8c90f2664a9d94a66ae3c57f9',
        'R2_SECRET_ACCESS_KEY=5418efa3b64053548d6d6e89324e9fc088c9cfde7ef249a65fcfdc0be680dbab',
        'R2_BUCKET_NAME=fp2p-content',
        'DEEPGRAM_API_KEY=898d35b676bb1adf602be06910be11f9a17756ba',
        'CAPTION_WORKER_SECRET=fp2p_super_secret_2026',
        ''
    ].join('\n');

    // Encode the WHOLE env file to base64 to avoid shell escaping issues entirely
    const envFileB64 = Buffer.from(envContent).toString('base64');

    // Create a node command to write the file (bypassing echo/pipes)
    const fixCmd = `node -e "require('fs').writeFileSync('/opt/caption-worker/.env', Buffer.from('${envFileB64}', 'base64').toString('utf8'))" && pm2 restart caption-worker`;

    fs.writeFileSync('magic_fix.txt', fixCmd);
    console.log("Magic fix command written to magic_fix.txt");

} catch (e) {
    console.error("Error:", e.message);
}
