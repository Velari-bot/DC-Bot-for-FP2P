const https = require('https');

function check(url) {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
        console.log(`URL: ${url}`);
        console.log(`Content-Type: ${res.headers['content-type']}`);
    });
    req.on('error', (e) => console.error(e));
    req.end();
}

check('https://www.fortnitepathtopro.com/ffmpeg/ffmpeg-core.wasm');
