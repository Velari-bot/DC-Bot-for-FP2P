const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    transcribeWithWhisper,
    polishTranscription,
    translateSegments,
    segmentsToVTT,
    segmentsToSRT,
    fullTranscriptionPipeline,
    SUPPORTED_LANGUAGES
} = require('./transcribe');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg',
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
        ];
        if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|mp4|wav|webm|ogg|m4a|avi|mov)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Supported: MP3, MP4, WAV, WebM, OGG, M4A, AVI, MOV'));
        }
    }
});

const router = express.Router();

/**
 * POST /api/transcribe-video/upload
 * Upload and transcribe a video/audio file
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { languages } = req.body;
        const targetLanguages = languages ? JSON.parse(languages) : [];

        console.log('File uploaded:', req.file.filename);
        console.log('Target languages:', targetLanguages);

        // Run the full transcription pipeline
        const results = await fullTranscriptionPipeline(req.file.path, targetLanguages);

        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Failed to delete temp file:', err);
        });

        res.json({
            success: true,
            results: results
        });
    } catch (error) {
        console.error('Transcription error:', error);

        // Clean up file on error
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => { });
        }

        res.status(500).json({
            error: 'Transcription failed',
            message: error.message
        });
    }
});

/**
 * POST /api/transcribe-video/transcribe-only
 * Just transcribe without polishing or translation
 */
router.post('/transcribe-only', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const transcription = await transcribeWithWhisper(req.file.path);

        // Clean up
        fs.unlink(req.file.path, () => { });

        res.json({
            success: true,
            transcription: {
                segments: transcription.segments,
                text: transcription.text,
                vtt: segmentsToVTT(transcription.segments),
                srt: segmentsToSRT(transcription.segments)
            }
        });
    } catch (error) {
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => { });
        }
        res.status(500).json({ error: 'Transcription failed', message: error.message });
    }
});

/**
 * POST /api/transcribe-video/polish
 * Polish existing transcription segments
 */
router.post('/polish', async (req, res) => {
    try {
        const { segments } = req.body;

        if (!segments || !Array.isArray(segments)) {
            return res.status(400).json({ error: 'Segments array required' });
        }

        const polishedSegments = await polishTranscription(segments);

        res.json({
            success: true,
            polished: {
                segments: polishedSegments,
                text: polishedSegments.map(s => s.text).join(' '),
                vtt: segmentsToVTT(polishedSegments),
                srt: segmentsToSRT(polishedSegments)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Polish failed', message: error.message });
    }
});

/**
 * POST /api/transcribe-video/translate
 * Translate existing transcription segments
 */
router.post('/translate', async (req, res) => {
    try {
        const { segments, language } = req.body;

        if (!segments || !Array.isArray(segments)) {
            return res.status(400).json({ error: 'Segments array required' });
        }

        if (!language || !SUPPORTED_LANGUAGES[language]) {
            return res.status(400).json({
                error: 'Valid language code required',
                supported: SUPPORTED_LANGUAGES
            });
        }

        const translatedSegments = await translateSegments(segments, language);

        res.json({
            success: true,
            translation: {
                language: SUPPORTED_LANGUAGES[language],
                languageCode: language,
                segments: translatedSegments,
                text: translatedSegments.map(s => s.text).join(' '),
                vtt: segmentsToVTT(translatedSegments),
                srt: segmentsToSRT(translatedSegments)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Translation failed', message: error.message });
    }
});

/**
 * GET /api/transcribe-video/languages
 * Get list of supported languages
 */
router.get('/languages', (req, res) => {
    res.json({
        success: true,
        languages: SUPPORTED_LANGUAGES
    });
});

module.exports = router;
