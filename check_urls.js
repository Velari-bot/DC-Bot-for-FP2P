const https = require('https');

function check(url, name) {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
        console.log(`[${name}] ${res.statusCode}`);
        if (res.statusCode === 302 && res.headers.location) {
            console.log(`[${name}] Redirect -> ${res.headers.location}`);
            check(res.headers.location, name);
        }
    });
    req.on('error', (e) => console.error(e));
    req.end();
}

check('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js', 'CORE_WORKER');
check('https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm/ffmpeg-core.worker.js', 'CORE_MT_WORKER');
