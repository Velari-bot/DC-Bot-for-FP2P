const https = require('https');

function get(url) {
    https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log('Redirecting to:', res.headers.location);
            get(res.headers.location); // Simple follow
            return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log(data);
        });
    });
}
get('https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/');
