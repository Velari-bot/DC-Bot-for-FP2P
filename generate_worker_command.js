const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve('fp2p-bcd48-firebase-adminsdk-fbsvc-e1b437bed5.json');
const sa = fs.readFileSync(jsonPath, 'utf8');
const b64 = Buffer.from(sa).toString('base64');

const envContent = [
    'PORT=3000',
    `FIREBASE_SERVICE_ACCOUNT_B64=${b64}`,
    'R2_ACCOUNT_ID=a22d72c334d2bf7722a6ab6e3300163e',
    'R2_ACCESS_KEY_ID=a99f0fe8c90f2664a9d94a66ae3c57f9',
    'R2_SECRET_ACCESS_KEY=5418efa3b64053548d6d6e89324e9fc088c9cfde7ef249a65fcfdc0be680dbab',
    'R2_BUCKET_NAME=fp2p-content',
    'DEEPGRAM_API_KEY=898d35b676bb1adf602be06910be11f9a17756ba',
    'CAPTION_WORKER_SECRET=fp2p_super_secret_2026',
    '' // Trailing newline
].join('\n');

const deployCmd = `echo "${Buffer.from(envContent).toString('base64')}" | base64 -d > /opt/caption-worker/.env && pm2 restart caption-worker`;

fs.writeFileSync('worker_deploy_cmd.txt', deployCmd);
console.log("Command written to worker_deploy_cmd.txt");
