require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Supported languages for translation
const SUPPORTED_LANGUAGES = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
    'ru': 'Russian',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'nl': 'Dutch',
    'pl': 'Polish',
    'tr': 'Turkish'
};

/**
 * Transcribe video/audio using OpenAI Whisper
 * Returns transcription with timestamps in VTT format
 */
async function transcribeWithWhisper(audioFilePath) {
    try {
        console.log('Starting Whisper transcription...');

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioFilePath),
            model: 'whisper-1',
            language: 'en',
            response_format: 'verbose_json',
            timestamp_granularities: ['segment', 'word']
        });

        console.log('Transcription complete!');
        return transcription;
    } catch (error) {
        console.error('Whisper transcription error:', error);
        throw error;
    }
}

/**
 * Polish the transcription using GPT-4 to fix grammar
 * Preserves timestamps while fixing text
 */
async function polishTranscription(segments) {
    try {
        console.log('Polishing transcription with GPT-4...');

        const polishedSegments = [];

        // Process in batches to avoid token limits
        const batchSize = 10;
        for (let i = 0; i < segments.length; i += batchSize) {
            const batch = segments.slice(i, i + batchSize);

            const segmentTexts = batch.map((seg, idx) => `[${idx}] ${seg.text}`).join('\n');

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional transcription editor. Fix grammar, punctuation, and capitalization in the following transcription segments. 
            
Rules:
- Keep the meaning exactly the same
- Fix obvious transcription errors
- Add proper punctuation
- Fix capitalization
- Do NOT change timestamps or segment numbers
- Return the corrected text in the same format: [number] corrected text
- Each segment should be on its own line`
                    },
                    {
                        role: 'user',
                        content: segmentTexts
                    }
                ],
                temperature: 0.3
            });

            const polishedText = response.choices[0].message.content;
            const lines = polishedText.split('\n').filter(l => l.trim());

            lines.forEach((line, idx) => {
                const match = line.match(/^\[(\d+)\]\s*(.+)$/);
                if (match && batch[parseInt(match[1])]) {
                    const originalSeg = batch[parseInt(match[1])];
                    polishedSegments.push({
                        ...originalSeg,
                        text: match[2].trim(),
                        original_text: originalSeg.text
                    });
                }
            });
        }

        console.log('Grammar polishing complete!');
        return polishedSegments;
    } catch (error) {
        console.error('Polish transcription error:', error);
        throw error;
    }
}

/**
 * Translate segments to target language using GPT-4
 * Preserves timestamps while translating
 */
async function translateSegments(segments, targetLanguage) {
    try {
        const languageName = SUPPORTED_LANGUAGES[targetLanguage] || targetLanguage;
        console.log(`Translating to ${languageName}...`);

        const translatedSegments = [];

        // Process in batches
        const batchSize = 10;
        for (let i = 0; i < segments.length; i += batchSize) {
            const batch = segments.slice(i, i + batchSize);

            const segmentTexts = batch.map((seg, idx) => `[${idx}] ${seg.text}`).join('\n');

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. Translate the following transcription segments from English to ${languageName}.

Rules:
- Provide accurate, natural-sounding translations
- Keep the segment numbers and format exactly the same
- Preserve any names, brands, or technical terms that shouldn't be translated
- Return the translated text in the same format: [number] translated text
- Each segment should be on its own line`
                    },
                    {
                        role: 'user',
                        content: segmentTexts
                    }
                ],
                temperature: 0.3
            });

            const translatedText = response.choices[0].message.content;
            const lines = translatedText.split('\n').filter(l => l.trim());

            lines.forEach((line, idx) => {
                const match = line.match(/^\[(\d+)\]\s*(.+)$/);
                if (match && batch[parseInt(match[1])]) {
                    const originalSeg = batch[parseInt(match[1])];
                    translatedSegments.push({
                        ...originalSeg,
                        text: match[2].trim(),
                        english_text: originalSeg.text
                    });
                }
            });
        }

        console.log(`Translation to ${languageName} complete!`);
        return translatedSegments;
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

/**
 * Convert segments to VTT subtitle format
 */
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

/**
 * Convert segments to SRT subtitle format
 */
function segmentsToSRT(segments) {
    let srt = '';

    segments.forEach((segment, index) => {
        const startTime = formatSRTTime(segment.start);
        const endTime = formatSRTTime(segment.end);

        srt += `${index + 1}\n`;
        srt += `${startTime} --> ${endTime}\n`;
        srt += `${segment.text}\n\n`;
    });

    return srt;
}

/**
 * Helper to format time for VTT (HH:MM:SS.mmm)
 */
function formatVTTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Helper to format time for SRT (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Full transcription pipeline: Transcribe -> Polish -> Translate
 */
async function fullTranscriptionPipeline(audioFilePath, targetLanguages = []) {
    const results = {
        original: null,
        polished: null,
        translations: {}
    };

    // Step 1: Transcribe with Whisper
    const transcription = await transcribeWithWhisper(audioFilePath);
    results.original = {
        segments: transcription.segments,
        text: transcription.text,
        vtt: segmentsToVTT(transcription.segments),
        srt: segmentsToSRT(transcription.segments)
    };

    // Step 2: Polish grammar
    const polishedSegments = await polishTranscription(transcription.segments);
    results.polished = {
        segments: polishedSegments,
        text: polishedSegments.map(s => s.text).join(' '),
        vtt: segmentsToVTT(polishedSegments),
        srt: segmentsToSRT(polishedSegments)
    };

    // Step 3: Translate to requested languages
    for (const lang of targetLanguages) {
        if (SUPPORTED_LANGUAGES[lang]) {
            const translatedSegments = await translateSegments(polishedSegments, lang);
            results.translations[lang] = {
                language: SUPPORTED_LANGUAGES[lang],
                segments: translatedSegments,
                text: translatedSegments.map(s => s.text).join(' '),
                vtt: segmentsToVTT(translatedSegments),
                srt: segmentsToSRT(translatedSegments)
            };
        }
    }

    return results;
}

module.exports = {
    transcribeWithWhisper,
    polishTranscription,
    translateSegments,
    segmentsToVTT,
    segmentsToSRT,
    fullTranscriptionPipeline,
    SUPPORTED_LANGUAGES
};
