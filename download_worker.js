const fs = require('fs');
const https = require('https');
const path = require('path');

const fileUrl = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js';
const outputPath = path.join(__dirname, 'public', 'ffmpeg', 'ffmpeg-core.worker.js');

const file = fs.createWriteStream(outputPath);

https.get(fileUrl, (response) => {
    if (response.statusCode === 302 || response.statusCode === 301) {
        console.log(`Redirecting to: ${response.headers.location}`);
        https.get(response.headers.location, (res) => {
            if (res.statusCode !== 200) {
                console.error(`Failed to download: ${res.statusCode}`);
                return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('Download completed.');
            });
        });
    } else if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log('Download completed.');
        });
    } else {
        console.error(`Failed to download: ${response.statusCode}`);
    }
}).on('error', (err) => {
    fs.unlink(outputPath, () => { }); // Delete the file async. (But we don't check the result)
    console.error(`Error: ${err.message}`);
});
