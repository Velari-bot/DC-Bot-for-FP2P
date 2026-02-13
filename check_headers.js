const https = require('https');

function check(url) {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
        console.log(`\nURL: ${url}`);
        console.log(`Status: ${res.statusCode}`);
        console.log('Headers:', res.headers);
    });
    req.on('error', (e) => console.error(e));
    req.end();
}

check('https://www.fortnitepathtopro.com/');
check('https://www.fortnitepathtopro.com/ffmpeg/ffmpeg-core.wasm');
check('https://www.fortnitepathtopro.com/ffmpeg/ffmpeg-core.worker.js');
