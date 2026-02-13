
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Cloudflare R2 Config
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'assets.fortnitepathtopro.com';

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error('❌ Missing R2 environment variables. Please check your .env file.');
    process.exit(1);
}

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

const PUBLIC_DIR = path.join(__dirname, '../public');
const IGNORE_DIRS = ['ffmpeg', 'videos']; // Skip ffmpeg (binaries) and videos (large files, handle separately if needed)
const IGNORE_FILES = ['index.html', 'manifest.json', 'robots.txt', '.DS_Store'];

// MIME Type Helper
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm'
    };
    return map[ext] || 'application/octet-stream';
}

// Recursive function to walk directories
async function uploadDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (IGNORE_DIRS.includes(file)) continue;
            await uploadDirectory(fullPath);
        } else {
            if (IGNORE_FILES.includes(file)) continue;

            // Calculate relative key
            const relativePath = path.relative(PUBLIC_DIR, fullPath).replace(/\\/g, '/'); // Ensure forward slashes

            console.log(`📤 Uploading: ${relativePath}...`);

            try {
                const fileContent = fs.readFileSync(fullPath);
                const command = new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: relativePath,
                    Body: fileContent,
                    ContentType: getContentType(fullPath),
                });

                await s3Client.send(command);
                console.log(`✅ Success: https://${R2_PUBLIC_DOMAIN}/${relativePath}`);
            } catch (err) {
                console.error(`❌ Error uploading ${relativePath}:`, err.message);
            }
        }
    }
}

console.log('🚀 Starting Bulk Upload to Cloudflare R2...');
console.log(`Target Bucket: ${R2_BUCKET_NAME}`);
console.log(`Source: ${PUBLIC_DIR}`);
console.log('----------------------------------------');

uploadDirectory(PUBLIC_DIR)
    .then(() => console.log('\n🎉 All uploads complete!'))
    .catch(err => console.error('Fatal Error:', err));
