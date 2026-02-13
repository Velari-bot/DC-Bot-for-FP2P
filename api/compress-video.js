const admin = require('./utils/firebaseAdmin');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');

ffmpeg.setFfmpegPath(ffmpegStatic);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { videoUrl, videoId } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'Missing videoUrl' });
    }

    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input-${Date.now()}.mp4`);
    const outputPath = path.join(tempDir, `output-${Date.now()}.mp4`);

    try {
        console.log(`Starting compression for: ${videoUrl}`);

        // 1. Download the video
        const response = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(inputPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log('Download complete, starting FFmpeg...');

        // 2. Compress the video
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                    '-c:v libx264',
                    '-crf 28',         // Lower quality but smaller file
                    '-preset faster',
                    '-movflags +faststart'
                ])
                .on('start', (commandLine) => {
                    console.log('Spawned FFmpeg with command: ' + commandLine);
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(err);
                })
                .on('end', () => {
                    console.log('Compression complete');
                    resolve();
                })
                .save(outputPath);
        });

        // 3. Upload to Firebase Storage
        const bucket = admin.storage().bucket();
        const destination = `compressed/${videoId || Date.now()}.mp4`;

        await bucket.upload(outputPath, {
            destination: destination,
            metadata: {
                contentType: 'video/mp4',
            }
        });

        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(destination)}?alt=media`;

        console.log(`Upload complete: ${publicUrl}`);

        // Cleanup
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.status(200).json({
            success: true,
            compressedUrl: publicUrl,
            key: destination
        });

    } catch (error) {
        console.error('Compression failed:', error);

        // Cleanup on error if files exist
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        res.status(500).json({
            error: 'Compression failed',
            details: error.message
        });
    }
};
