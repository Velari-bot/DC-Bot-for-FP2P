const fs = require('fs');
const https = require('https');
const path = require('path');

const files = [
    'ffmpeg-core.js',
    'ffmpeg-core.wasm',
    'ffmpeg-core.wasm'
];
const baseUrl = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/';
const outputDir = path.join(__dirname, 'public', 'ffmpeg');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function download(file) {
    const url = baseUrl + file;
    const outputPath = path.join(outputDir, file);
    const fileStream = fs.createWriteStream(outputPath);

    console.log(`Downloading ${file} from ${url}...`);

    https.get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            console.log(`Redirecting to: ${response.headers.location}`);
            https.get(response.headers.location, (res) => {
                if (res.statusCode !== 200) {
                    console.error(`Failed to download ${file}: ${res.statusCode}`);
                    return;
                }
                res.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`${file} completed.`);
                });
            });
            return;
        }

        if (response.statusCode !== 200) {
            console.error(`Failed to download ${file}: ${response.statusCode}`);
            return;
        }
        response.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`${file} completed.`);
        });
    }).on('error', (err) => {
        console.error(`Error downloading ${file}: ${err.message}`);
    });
}

files.forEach(download);
