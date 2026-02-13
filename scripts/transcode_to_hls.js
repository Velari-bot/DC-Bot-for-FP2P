const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

// This script transcodes a video file into HLS format with multiple quality levels.
// Requirements:
// 1. ffmpeg must be installed on the system and in the PATH.
// 2. npm install fluent-ffmpeg

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node scripts/transcode_to_hls.js <input_video_path> <output_directory>");
    process.exit(1);
}

const inputPath = path.resolve(args[0]);
const outputDir = path.resolve(args[1]);

if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`Transcoding ${inputPath} to HLS in ${outputDir}...`);

// Define quality levels
const renditions = [
    { name: '360p', resolution: '640x360', bitrate: '800k', audioRate: '96k' },
    { name: '480p', resolution: '854x480', bitrate: '1400k', audioRate: '128k' },
    { name: '720p', resolution: '1280x720', bitrate: '2800k', audioRate: '128k' }
];

const command = ffmpeg(inputPath);

renditions.forEach((r) => {
    command
        .output(path.join(outputDir, `${r.name}.m3u8`))
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(r.resolution)
        .videoBitrate(r.bitrate)
        .audioBitrate(r.audioRate)
        .outputOptions([
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls'
        ]);
});

// Create master playlist manually or assume player handles adaptive (simplified)
// For true adaptive, we need to generate lines for master playlist.
// This script generates separate quality streams. 
// A master playlist generator is needed next.

command
    .on('end', () => {
        console.log('Transcoding finished!');
        createMasterPlaylist(outputDir, renditions);
    })
    .on('error', (err) => {
        console.error('Error:', err);
    })
    .run();

function createMasterPlaylist(dir, renditions) {
    let content = '#EXTM3U\n#EXT-X-VERSION:3\n';
    renditions.forEach(r => {
        const bandwidth = parseInt(r.bitrate) * 1000 + parseInt(r.audioRate) * 1000;
        content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${r.resolution}\n${r.name}.m3u8\n`;
    });

    fs.writeFileSync(path.join(dir, 'master.m3u8'), content);
    console.log(`Master playlist created at ${path.join(dir, 'master.m3u8')}`);
}
