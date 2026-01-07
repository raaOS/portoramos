const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller);

const MEDIA_DIR = path.join(process.cwd(), 'public', 'assets', 'media');
const TARGET_SIZE_MB = 1;

// Helper to get file size in MB
const getFileSizeMB = (filePath) => {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
};

// Process video
const compressVideo = (filePath) => {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const tempPath = filePath.replace(path.extname(filePath), '_temp' + path.extname(filePath));

        console.log(`\n🎬 Processing: ${fileName} (${getFileSizeMB(filePath).toFixed(2)} MB)`);

        ffmpeg(filePath)
            // Resize to 720p (Balanced for web). 
            // use 'scale=480:-2' for aggressive <1MB target
            .outputOptions('-vf', 'scale=720:-2')

            // Ensure yuv420p pixel format for widest web compatibility (prevents playback errors)
            .outputOptions('-pix_fmt', 'yuv420p')

            // Video Codec: H.264
            .videoCodec('libx264')

            // CRF 28 (Balanced). Use 33+ for aggressive size reduction
            .outputOptions('-crf', '28')

            // Preset: slower = better compression efficiency
            .outputOptions('-preset', 'veryslow')

            // Remove audio (covers often don't need it, saves space)
            // If user wants audio, we can remove this line.
            // Assuming "cover" implies valid visual-only background usually.
            .noAudio()

            // Web optimization (fast start)
            .outputOptions('-movflags', '+faststart')

            .on('end', () => {
                const newSize = getFileSizeMB(tempPath);
                console.log(`✅ Done: ${fileName} -> ${newSize.toFixed(2)} MB`);

                if (newSize < getFileSizeMB(filePath)) {
                    fs.unlinkSync(filePath);
                    fs.renameSync(tempPath, filePath);
                    resolve(true);
                } else {
                    console.log(`⚠️  Compressed file was larger? Discarding.`);
                    fs.unlinkSync(tempPath);
                    resolve(false);
                }
            })
            .on('error', (err) => {
                console.error(`❌ Error processing ${fileName}:`, err.message);
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                reject(err);
            })
            .save(tempPath);
    });
};

async function main() {
    if (!fs.existsSync(MEDIA_DIR)) {
        console.error('Media directory not found!');
        return;
    }

    const files = fs.readdirSync(MEDIA_DIR);
    const videos = files.filter(f => f.match(/\.(mp4|mov|webm)$/i));

    console.log(`Found ${videos.length} videos.`);

    for (const video of videos) {
        const filePath = path.join(MEDIA_DIR, video);
        if (getFileSizeMB(filePath) > TARGET_SIZE_MB) {
            try {
                await compressVideo(filePath);
            } catch (e) {
                console.error(e);
            }
        } else {
            console.log(`⏭️  Skipping ${video} (Already < ${TARGET_SIZE_MB} MB)`);
        }
    }
}

main();
