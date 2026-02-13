const express = require('express');
const admin = require('firebase-admin');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Auth Middleware
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
    } catch (e) {
        console.error("Firebase Init Error:", e.message);
    }
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

// Helper: Translate VTT content using OpenAI
async function translateVTT(vttContent, targetLang) {
    if (targetLang === 'en') return vttContent;

    // We map common codes to full names for better AI prompting
    const langMap = {
        'es': 'Spanish', 'fr': 'French', 'de': 'German', 'ja': 'Japanese',
        'pt': 'Portuguese', 'zh': 'Chinese', 'ko': 'Korean', 'ru': 'Russian'
    };
    const langName = langMap[targetLang] || targetLang;

    console.log(`Translating captions to ${langName} using OpenAI...`);

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // High quality translation
            messages: [
                {
                    role: "system",
                    content: `You are a professional subtitle translator. Iterate over the user provided WebVTT file content. Translate the subtitle text accurately into ${langName}. Preserve the timestamps, structure, and formatting exactly. Do NOT add any conversational headers/footers.`
                },
                {
                    role: "user",
                    content: vttContent
                }
            ],
            temperature: 0.3,
        });

        return response.choices[0].message.content.trim();
    } catch (e) {
        console.error("Translation Error:", e.message);
        throw e;
    }
}

app.post('/process', validateSecret, async (req, res) => {
    const { videoId, videoUrl, language = 'en' } = req.body;
    res.status(202).json({ message: 'Processing job accepted' });

    try {
        console.log(`Starting process for: ${videoId} (Target: ${language})`);

        // 1. Always Transcribe Original English Audio via Deepgram first
        const transcriptResponse = await axios.post(
            'https://api.deepgram.com/v1/listen?smart_format=true&vtt=true&language=en',
            { url: videoUrl },
            { headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`, 'Content-Type': 'application/json' } }
        );

        let finalVtt = transcriptResponse.data;

        // 2. If target is NOT English, Translate it
        if (language !== 'en') {
            finalVtt = await translateVTT(finalVtt, language);
        }

        const vttKey = `captions/${videoId}_${language}.vtt`;

        // 3. Upload to R2
        await s3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: vttKey,
            Body: finalVtt,
            ContentType: 'text/vtt',
        }));

        // 4. Update Firebase
        await db.collection('videoCaptions').doc(videoId).set({
            captionStatus: 'ready',
            vttFiles: { [language]: vttKey }
        }, { merge: true });

        console.log(`Successfully processed ${videoId} in ${language}`);

    } catch (error) {
        console.error('Processing Failed:', error.message);
        // If it was an OpenAI error, try to log it specifically
        if (error.response?.data) console.error("API details:", JSON.stringify(error.response.data));

        try {
            await db.collection('videoCaptions').doc(videoId).set({ captionStatus: 'error' }, { merge: true });
        } catch (dbErr) { console.error("Firebase Update Error:", dbErr.message); }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Caption worker on port ${PORT}`));
