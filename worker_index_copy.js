const express = require('express');
const admin = require('firebase-admin');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Auth Middleware (To make sure only YOUR site can trigger this)
const validateSecret = (req, res, next) => {
    const key = req.headers['x-worker-secret'];
    const secret = process.env.CAPTION_WORKER_SECRET;
    if (!secret || key !== secret) return res.status(401).send('Unauthorized');
    next();
};

// Initialize Firebase
if (process.env.FIREBASE_SERVICE_ACCOUNT_B64) {
    try {
        const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString());
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch (e) { console.error("Firebase Init Error:", e.message); }
}
const db = admin.firestore();

// Initialize R2
const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

app.post('/process', validateSecret, async (req, res) => {
    const { videoId, videoUrl, language = 'en' } = req.body;
    res.status(202).json({ message: 'Processing job accepted' });

    try {
        console.log(`Starting transcription for: ${videoId}`);
        
        // Call Deepgram AI
        const response = await axios.post(
            'https://api.deepgram.com/v1/listen?smart_format=true&vtt=true',
            { url: videoUrl },
            { headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, 'Content-Type': 'application/json' } }
        );

        const vttKey = `captions/${videoId}_${language}.vtt`;

        // Upload to R2
        await s3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: vttKey,
            Body: response.data,
            ContentType: 'text/vtt',
        }));

        // Update Firebase
        await db.collection('videoCaptions').doc(videoId).set({
            captionStatus: 'ready',
            vttFiles: { [language]: vttKey }
        }, { merge: true });

        console.log(`Successfully processed ${videoId}`);
    } catch (error) {
        console.error('Processing Failed:', error.message);
        try {
            await db.collection('videoCaptions').doc(videoId).set({ captionStatus: 'error' }, { merge: true });
        } catch (dbErr) { console.error("Firebase Update Error:", dbErr.message); }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Caption worker on port ${PORT}`));
