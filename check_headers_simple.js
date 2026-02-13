const https = require('https');

function check(url) {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
        console.log(`\nURL: ${url}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
        console.log(`COEP: ${res.headers['cross-origin-embedder-policy']}`);
        console.log(`COOP: ${res.headers['cross-origin-opener-policy']}`);
    });
    req.on('error', (e) => console.error(e));
    req.end();
}

check('https://www.fortnitepathtopro.com/');
check('https://www.fortnitepathtopro.com/ffmpeg/ffmpeg-core.wasm');
check('https://www.fortnitepathtopro.com/ffmpeg/ffmpeg-core.worker.js');
