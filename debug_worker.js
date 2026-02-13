const axios = require('axios');

async function testWorker() {
    try {
        const response = await axios.post('http://66.135.7.53:3000/process', {
            videoId: 'debug_test_1',
            videoUrl: 'https://assets.fortnitepathtopro.com/videos/test.mp4', // Use a dummy url or valid one
            language: 'en'
        }, {
            headers: { 'X-Worker-Secret': 'fp2p_super_secret_2026' },
            timeout: 5000
        });
        console.log("Success:", response.data);
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error("Data:", e.response.data);
    }
}

testWorker();
