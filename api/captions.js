require('dotenv').config();
const admin = require('./utils/firebaseAdmin');
const axios = require('axios');
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const r2 = require('./utils/r2');
const crypto = require('crypto');
const OpenAI = require('openai');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Configure ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Supported languages for translation
const TRANSLATION_LANGUAGES = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
    'ar': 'Arabic'
};

// Helper to download video/audio to temp file
async function downloadToTempFile(url) {
    const tempPath = path.join(require('os').tmpdir(), `media_${Date.now()}.mp4`);
    const writer = fs.createWriteStream(tempPath);

    try {
        console.log(`[Download] Starting download from: ${url}`);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            validateStatus: (status) => status >= 200 && status < 400,
            maxRedirects: 5
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                try {
                    const stats = fs.statSync(tempPath);
                    console.log(`[Download] Saved ${stats.size} bytes to ${tempPath}`);

                    if (stats.size === 0) {
                        try { fs.unlinkSync(tempPath); } catch (e) { }
                        reject(new Error("Downloaded file is empty (0 bytes)"));
                    } else {
                        resolve(tempPath);
                    }
                } catch (e) {
                    reject(e);
                }
            });
            writer.on('error', (err) => {
                try { fs.unlinkSync(tempPath); } catch (e) { }
                reject(err);
            });
        });
    } catch (error) {
        if (fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch (e) { }
        }
        console.error(`[Download Error] ${error.message}`);
        throw new Error(`Download failed: ${error.message}`);
    }
}

// Helper to convert video to audio (MP3)
async function convertVideoToAudio(inputPath) {
    const outputPath = inputPath.replace(path.extname(inputPath), '.mp3');
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('mp3')
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
            .save(outputPath);
    });
}

// Helper to create optimal short segments from words
function createOptimalSegments(words, maxWords = 3, maxChars = 20) {
    const segments = [];
    if (!words || words.length === 0) return segments;

    let currentWords = [];
    let currentTextLength = 0;
    let startTime = words[0].start;

    for (let i = 0; i < words.length; i++) {
        const wordObj = words[i];
        const word = wordObj.word.trim();

        if (!word) continue;

        // Check forcing conditions for new segment
        const timeGap = (currentWords.length > 0) ? (wordObj.start - currentWords[currentWords.length - 1].end) : 0;
        const projectedLen = currentTextLength + word.length + 1;

        if (currentWords.length > 0 && (
            currentWords.length >= maxWords ||
            projectedLen > maxChars ||
            timeGap > 1.5
        )) {
            // Push current segment
            segments.push({
                start: startTime,
                end: currentWords[currentWords.length - 1].end,
                text: currentWords.map(w => w.word).join(' ').replace(/\s+([.,!?;:])/g, '$1').trim(),
                words: [...currentWords]
            });

            // Start new
            currentWords = [];
            currentTextLength = 0;
            startTime = wordObj.start;
        }

        currentWords.push(wordObj);
        currentTextLength += word.length;
    }

    // Push trailing
    if (currentWords.length > 0) {
        segments.push({
            start: startTime,
            end: currentWords[currentWords.length - 1].end,
            text: currentWords.map(w => w.word).join(' ').replace(/\s+([.,!?;:])/g, '$1').trim(),
            words: [...currentWords]
        });
    }

    return segments;
}

// Transcribe with Whisper (handles large files via chunking)
async function transcribeWithWhisper(mediaPath) {
    let mp3Path = null;
    let chunkDir = null;

    try {
        // 1. Convert to MP3 to reduce size
        console.log(`[Whisper] Converting to MP3: ${mediaPath}`);
        try {
            mp3Path = await convertVideoToAudio(mediaPath);
        } catch (e) {
            console.error("Audio conversion failed, falling back to original file:", e);
            mp3Path = mediaPath;
        }

        // 2. Check file size
        const stats = fs.statSync(mp3Path);
        const fileSizeMB = stats.size / (1024 * 1024);
        console.log(`[Whisper] Audio file size: ${fileSizeMB.toFixed(2)} MB`);

        // If file is small enough, transcribe directly
        if (fileSizeMB < 25) {
            const result = await openai.audio.transcriptions.create({
                file: fs.createReadStream(mp3Path),
                model: 'whisper-1',
                language: 'en',
                response_format: 'verbose_json',
                timestamp_granularities: ['word', 'segment']
            });

            // Re-segment for better display
            if (result.words) {
                result.segments = createOptimalSegments(result.words);
            }
            return result;
        }

        // 3. Chunking logic for large files (>25MB)
        console.log(`[Whisper] File too large (>25MB), splitting into chunks...`);

        chunkDir = path.join(path.dirname(mp3Path), `chunks_${Date.now()}`);
        if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir);

        const segmentTime = 600; // 10 minutes per chunk
        const outputPattern = path.join(chunkDir, 'chunk_%03d.mp3');

        await new Promise((resolve, reject) => {
            ffmpeg(mp3Path)
                .outputOptions([
                    '-f segment',
                    `-segment_time ${segmentTime}`,
                    '-c copy'
                ])
                .output(outputPattern)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // 4. Transcribe chunks
        const chunkFiles = fs.readdirSync(chunkDir).sort();
        let allWords = [];
        let fullText = "";

        console.log(`[Whisper] Processing ${chunkFiles.length} chunks...`);

        for (let i = 0; i < chunkFiles.length; i++) {
            const chunkFile = chunkFiles[i];
            const chunkPath = path.join(chunkDir, chunkFile);
            console.log(`[Whisper] Transcribing chunk ${i + 1}/${chunkFiles.length}: ${chunkFile}`);

            try {
                const result = await openai.audio.transcriptions.create({
                    file: fs.createReadStream(chunkPath),
                    model: 'whisper-1',
                    language: 'en',
                    response_format: 'verbose_json',
                    timestamp_granularities: ['word', 'segment']
                });

                // Adjust timestamps for this chunk
                const timeOffset = i * segmentTime;

                if (result.words) {
                    const adjustedWords = result.words.map(w => ({
                        ...w,
                        start: w.start + timeOffset,
                        end: w.end + timeOffset
                    }));
                    allWords = allWords.concat(adjustedWords);
                } else {
                    // Fallback if no words (shouldn't happen with 'word' granularity)
                    const adjustedSegments = result.segments.map(s => ({
                        word: s.text,
                        start: s.start + timeOffset,
                        end: s.end + timeOffset
                    }));
                    allWords = allWords.concat(adjustedSegments);
                }

                fullText += result.text + " ";

                // Delete chunk after processing
                try { fs.unlinkSync(chunkPath); } catch (e) { }

            } catch (err) {
                console.error(`[Whisper] Error transcribing chunk ${chunkFile}:`, err);
                throw err;
            }
        }

        // Create optimal segments from all words
        const finalSegments = createOptimalSegments(allWords);

        return {
            task: 'transcribe',
            language: 'english',
            duration: finalSegments.length > 0 ? finalSegments[finalSegments.length - 1].end : 0,
            text: fullText.trim(),
            segments: finalSegments,
            words: allWords
        };

    } finally {
        if (mp3Path && mp3Path !== mediaPath && fs.existsSync(mp3Path)) {
            try { fs.unlinkSync(mp3Path); } catch (e) { }
        }
        if (chunkDir && fs.existsSync(chunkDir)) {
            try {
                const remaining = fs.readdirSync(chunkDir);
                remaining.forEach(f => fs.unlinkSync(path.join(chunkDir, f)));
                fs.rmdirSync(chunkDir);
            } catch (e) {
                console.error("Error cleaning up chunks:", e);
            }
        }
    }
}

// Polish transcription with GPT-4
async function polishTranscription(segments) {
    const polishedSegments = [];
    const batchSize = 10;

    for (let i = 0; i < segments.length; i += batchSize) {
        const batch = segments.slice(i, i + batchSize);
        const segmentTexts = batch.map((seg, idx) => `[${idx}] ${seg.text}`).join('\n');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are a professional transcription editor. Fix grammar, punctuation, and capitalization.
                    
Rules:
- Keep the meaning exactly the same
- Fix obvious transcription errors
- Add proper punctuation
- Fix capitalization
- Return the corrected text in the same format: [number] corrected text
- Each segment should be on its own line`
                },
                { role: 'user', content: segmentTexts }
            ],
            temperature: 0.3
        });

        const polishedText = response.choices[0].message.content;
        const lines = polishedText.split('\n').filter(l => l.trim());

        lines.forEach((line) => {
            const match = line.match(/^\[(\d+)\]\s*(.+)$/);
            if (match && batch[parseInt(match[1])]) {
                const originalSeg = batch[parseInt(match[1])];
                polishedSegments.push({
                    ...originalSeg,
                    text: match[2].trim()
                });
            }
        });
    }

    return polishedSegments;
}

// Translate segments
async function translateSegments(segments, targetLanguage) {
    const languageName = TRANSLATION_LANGUAGES[targetLanguage];
    const translatedSegments = [];
    const batchSize = 10;

    for (let i = 0; i < segments.length; i += batchSize) {
        const batch = segments.slice(i, i + batchSize);
        const segmentTexts = batch.map((seg, idx) => `[${idx}] ${seg.text}`).join('\n');

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `Translate the following transcription segments from English to ${languageName}.

Rules:
- Provide accurate, natural-sounding translations
- Keep the segment numbers
- Return format: [number] translated text
- Each segment on its own line`
                },
                { role: 'user', content: segmentTexts }
            ],
            temperature: 0.3
        });

        const translatedText = response.choices[0].message.content;
        const lines = translatedText.split('\n').filter(l => l.trim());

        lines.forEach((line) => {
            const match = line.match(/^\[(\d+)\]\s*(.+)$/);
            if (match && batch[parseInt(match[1])]) {
                const originalSeg = batch[parseInt(match[1])];
                translatedSegments.push({
                    ...originalSeg,
                    text: match[2].trim()
                });
            }
        });
    }

    return translatedSegments;
}

// Convert segments to VTT format
function segmentsToVTT(segments) {
    let vtt = 'WEBVTT\n\n';

    segments.forEach((segment, index) => {
        const startTime = formatVTTTime(segment.start);
        const endTime = formatVTTTime(segment.end);

        vtt += `${index + 1}\n`;
        vtt += `${startTime} --> ${endTime}\n`;
        vtt += `${segment.text}\n\n`;
    });

    return vtt;
}

function formatVTTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// Upload VTT to R2
async function uploadVTTToR2(vttContent, videoId, lang) {
    const bucketName = process.env.R2_BUCKET_NAME || "fp2p-content";
    const key = `captions/${videoId}/${lang}.vtt`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: vttContent,
        ContentType: 'text/vtt'
    });

    await r2.send(command);
    return key;
}

// Helper for logging to Firestore
async function logSystem(db, type, message, meta = {}) {
    try {
        await db.collection('systemLogs').add({
            type, // 'info', 'error', 'success', 'warning'
            message,
            meta,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error("Failed to write system log:", e);
    }
}

// Main processing function
async function processVideoWithWhisper(videoId, videoUrl, db) {
    let tempFilePath = null;

    try {
        const docRef = db.collection('videoCaptions').doc(videoId);
        const doc = await docRef.get();
        const existingData = doc.data();

        let polishedSegments = existingData?.polishedSegments;

        // Log start
        await logSystem(db, 'info', `Processing started for video ${videoId}`, { videoId });

        // If we don't have polished segments, we need to transcribe
        if (!polishedSegments || !Array.isArray(polishedSegments)) {
            // Update status to processing
            await docRef.update({ captionStatus: 'processing' });

            console.log(`[${videoId}] Downloading video...`);
            tempFilePath = await downloadToTempFile(videoUrl);

            // Transcribe
            console.log(`[${videoId}] Transcribing with Whisper...`);
            const transcription = await transcribeWithWhisper(tempFilePath);

            // Update status
            await docRef.update({ captionStatus: 'cleaning' });

            // Polish
            console.log(`[${videoId}] Polishing transcription...`);
            polishedSegments = await polishTranscription(transcription.segments);

            // Save intermediate result to allow resuming later
            await docRef.update({
                polishedSegments: polishedSegments,
                captionStatus: 'translating'
            });
        } else {
            console.log(`[${videoId}] Found existing polished segments. Resuming from translation...`);
            await docRef.update({ captionStatus: 'translating' });
        }

        // Generate VTT files
        const vttFiles = existingData?.vttFiles || {};

        // English (polished)
        if (!vttFiles['en']) {
            console.log(`[${videoId}] Generating English VTT...`);
            const englishVTT = segmentsToVTT(polishedSegments);
            vttFiles['en'] = await uploadVTTToR2(englishVTT, videoId, 'en');

            // Incremental update
            await docRef.update({ vttFiles: vttFiles });
        }

        // Only translate if specifically requested OR if target language is not 'en'
        // If we want to be "quick and cheap", we only do English unless needed.
        const targetLanguage = existingData?.language || 'en';
        const shouldTranslate = targetLanguage !== 'en';

        // Translate to other languages
        if (shouldTranslate) {
            for (const [langCode, langName] of Object.entries(TRANSLATION_LANGUAGES)) {
                if (vttFiles[langCode]) {
                    console.log(`[${videoId}] Skipping ${langName}, already exists.`);
                    continue;
                }

                console.log(`[${videoId}] Translating to ${langName}...`);
                try {
                    const translatedSegments = await translateSegments(polishedSegments, langCode);
                    const translatedVTT = segmentsToVTT(translatedSegments);
                    const vttKey = await uploadVTTToR2(translatedVTT, videoId, langCode);

                    vttFiles[langCode] = vttKey;

                    // Incremental update to Firestore after each language
                    await docRef.update({
                        vttFiles: vttFiles,
                        captionStatus: 'translating'
                    });

                } catch (translationError) {
                    console.error(`[${videoId}] Translation to ${langName} failed:`, translationError.message);
                }
            }
        }

        // Update status to finalizing
        await docRef.update({
            captionStatus: 'uploading'
        });

        // Check completeness
        const expectedLangs = shouldTranslate ? ['en', ...Object.keys(TRANSLATION_LANGUAGES)] : ['en'];
        const completedLangs = Object.keys(vttFiles);
        const isComplete = expectedLangs.every(l => completedLangs.includes(l));

        // Final update
        await docRef.update({
            captionStatus: isComplete ? 'ready' : (shouldTranslate ? 'ready_incomplete' : 'ready'),
            vttFiles: vttFiles,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            fullTranscript: polishedSegments.map(s => s.text).join(' ')
        });

        await logSystem(db, isComplete ? 'success' : 'warning', `Processing finished for ${videoId}. Completeness: ${completedLangs.length}/${expectedLangs.length}`, { videoId, missing: expectedLangs.filter(l => !completedLangs.includes(l)) });
        console.log(`[${videoId}] Processing complete!`);

    } catch (error) {
        console.error(`[${videoId}] Processing error:`, error);
        await logSystem(db, 'error', `Processing failed for ${videoId}: ${error.message}`, { videoId, error: error.message });
        await db.collection('videoCaptions').doc(videoId).update({
            captionStatus: 'error',
            errorMessage: error.message
        });
    } finally {
        // Clean up temp file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch (e) { }
        }
    }
}

// Global Queue State (Persists across requests in npm start / local node)
const JOB_QUEUE = [];
let IS_PROCESSING = false;

async function processQueue(db) {
    if (IS_PROCESSING || JOB_QUEUE.length === 0) return;

    IS_PROCESSING = true;
    const job = JOB_QUEUE.shift();

    try {
        console.log(`[Queue] Processing video ${job.videoId}. Queue size: ${JOB_QUEUE.length}`);
        // Log start
        if (typeof logSystem === 'function') {
            await logSystem(db, 'info', `Processing started from queue (Remaining: ${JOB_QUEUE.length})`, { videoId: job.videoId });
        }

        await processVideoWithWhisper(job.videoId, job.videoUrl, db);

    } catch (err) {
        console.error(`[Queue] Job ${job.videoId} failed:`, err);
        if (typeof logSystem === 'function') {
            await logSystem(db, 'error', `Queue job failed: ${err.message}`, { videoId: job.videoId });
        }
        // Mark as error in DB
        await db.collection('videoCaptions').doc(job.videoId).update({
            captionStatus: 'error',
            errorMessage: `Queue Failure: ${err.message}`
        });
    } finally {
        IS_PROCESSING = false;
        // Process next after short delay to let OS clean up temp files
        setTimeout(() => processQueue(db), 2000);
    }
}

module.exports = async (req, res) => {
    const { action } = req.query;

    if (action === 'get') {
        const { videoId } = req.query;
        if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

        try {
            const db = admin.firestore();
            const doc = await db.collection('videoCaptions').doc(videoId).get();
            if (!doc.exists) return res.status(404).json({ error: 'Caption metadata not found' });

            const data = doc.data();
            const publicDomain = process.env.R2_PUBLIC_DOMAIN || `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME || 'fp2p-content'}`;
            const baseUrl = publicDomain.startsWith('http') ? publicDomain : `https://${publicDomain}`;

            const tracks = {};
            if (data.vttFiles) {
                for (const [lang, key] of Object.entries(data.vttFiles)) {
                    tracks[lang] = `${baseUrl}/${key}`;
                }
            }

            return res.status(200).json({
                videoId: data.videoId,
                status: data.captionStatus,
                tracks: tracks,
                transcript: data.fullTranscript || null
            });
        } catch (error) {
            console.error("Error fetching captions:", error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    if (action === 'clear_queue') {
        const clearedCount = JOB_QUEUE.length;
        JOB_QUEUE.length = 0; // Clear the queue array

        try {
            const db = admin.firestore();
            await logSystem(db, 'warning', `COMMAND: Queue cleared by admin. Removed ${clearedCount} pending jobs.`);
        } catch (e) { }

        return res.status(200).json({
            success: true,
            message: `Queue cleared. Removed ${clearedCount} pending jobs.`
        });
    }

    if (action === 'audit') {
        const { videoIds } = req.body; // Expect array of videoIds
        if (!videoIds || !Array.isArray(videoIds)) return res.status(400).json({ error: 'Missing videoIds array' });

        try {
            const db = admin.firestore();
            const incompleteVideos = [];
            const expectedLangs = ['en', ...Object.keys(TRANSLATION_LANGUAGES)];

            const chunkedIds = [];
            for (let i = 0; i < videoIds.length; i += 10) {
                chunkedIds.push(videoIds.slice(i, i + 10));
            }

            for (const chunk of chunkedIds) {
                const refs = chunk.map(id => db.collection('videoCaptions').doc(id));
                const docs = await db.getAll(...refs);

                docs.forEach(doc => {
                    if (doc.exists) {
                        const data = doc.data();
                        const vttFiles = data.vttFiles || {};
                        const missing = expectedLangs.filter(l => !vttFiles[l]);

                        if (missing.length > 0) {
                            incompleteVideos.push({
                                videoId: doc.id,
                                missing: missing,
                                status: data.captionStatus
                            });
                        }
                    } else {
                        // Doc doesn't exist = completely missing
                        incompleteVideos.push({
                            videoId: doc.id,
                            missing: expectedLangs,
                            status: 'missing'
                        });
                    }
                });
            }

            return res.status(200).json({ incompleteVideos });

        } catch (error) {
            console.error("Error auditing videos:", error);
            return res.status(500).json({ error: error.message });
        }
    }

    if (action === 'start') {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

        try {
            const { videoId, videoUrl, language = 'en' } = req.body;
            if (!videoId || !videoUrl) return res.status(400).json({ error: 'Missing videoId or videoUrl' });

            const db = admin.firestore();

            // Check if OpenAI API key is configured
            if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
                // Fall back to external worker if OpenAI not configured
                const workerUrl = (process.env.CAPTION_WORKER_URL || '').trim();
                const workerSecret = (process.env.CAPTION_WORKER_SECRET || '').trim();

                await db.collection('videoCaptions').doc(videoId).set({
                    videoId,
                    videoUrl,
                    captionStatus: 'processing',
                    language,
                    processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                if (workerUrl) {
                    try {
                        await axios.post(`${workerUrl}/process`, { videoId, videoUrl, language }, {
                            timeout: 10000,
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Worker-Secret': workerSecret
                            }
                        });
                        return res.status(200).json({ success: true, message: 'Caption processing triggered via external worker.' });
                    } catch (workerError) {
                        console.error("Worker error:", workerError.message);
                    }
                }

                return res.status(200).json({ success: true, message: 'Status updated. Configure OPENAI_API_KEY for Whisper processing.' });
            }

            // Initialize processing status
            await db.collection('videoCaptions').doc(videoId).set({
                videoId,
                videoUrl,
                captionStatus: 'queued',
                language,
                processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Add to persistent queue
            JOB_QUEUE.push({ videoId, videoUrl });
            console.log(`[Queue] Video ${videoId} queued. Position: ${JOB_QUEUE.length}`);

            // Trigger processor (fire and forget)
            if (!IS_PROCESSING) {
                processQueue(db);
            }

            return res.status(200).json({
                success: true,
                message: `Transcription queued! Position: ${JOB_QUEUE.length}. System processes 1 video at a time.`
            });

        } catch (error) {
            console.error("Error starting caption process:", error);
            return res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }

    if (action === 'upload') {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        try {
            const { filename, contentType } = req.body;
            if (!filename || !contentType) return res.status(400).json({ error: 'Missing filename or contentType' });

            const videoId = crypto.randomUUID();
            const bucketName = process.env.R2_BUCKET_NAME || "fp2p-content";
            const key = `videos/${videoId}/${filename}`;

            const db = admin.firestore();
            await db.collection('videoCaptions').doc(videoId).set({
                videoId,
                originalFilename: filename,
                uploadTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                captionStatus: 'pending',
                r2Key: key,
                contentType
            });

            const command = new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: contentType });
            const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

            const publicDomain = process.env.R2_PUBLIC_DOMAIN || `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}`;
            const videoUrl = publicDomain.startsWith('http') ? `${publicDomain}/${key}` : `https://${publicDomain}/${key}`;

            return res.status(200).json({ videoId, uploadUrl, videoUrl, key });
        } catch (error) {
            console.error("Error in api/captions upload:", error);
            return res.status(500).json({ error: 'Internal Server Error', message: error.message, stack: error.stack });
        }
    }

    return res.status(400).json({ error: 'Invalid action' });
};
