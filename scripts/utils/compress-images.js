const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller);

const MEDIA_DIR = path.join(process.cwd(), 'public', 'assets', 'media');
const MAX_WIDTH = 1600; // Safe for web covers
const TARGET_SIZE_MB = 0.8; // Target < 800KB

// Helper to get file size in MB
const getFileSizeMB = (filePath) => {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024);
};

// Process image
const compressImage = (filePath) => {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const tempPath = filePath.replace(path.extname(filePath), '_temp' + path.extname(filePath));

        console.log(`\n🖼️  Processing: ${fileName} (${getFileSizeMB(filePath).toFixed(2)} MB)`);

        ffmpeg(filePath)
            // Resize to max width 1600, keep aspect ratio
            .outputOptions('-vf', `scale='min(${MAX_WIDTH},iw)':-1`)
            // Quality scale for JPEG (2-31, lower is better?) 
            // For Image2/MJPEG, -q:v works. Range 1-31.
            // Let's try q:v 5 (Very high quality)
            .outputOptions('-q:v', '5')
            .on('end', () => {
                const newSize = getFileSizeMB(tempPath);
                console.log(`✅ Done: ${fileName} -> ${newSize.toFixed(2)} MB`);

                // If new size is smaller OR original was huge (>2MB), take it.
                // If original was small and we made it bigger (unlikely with resize), keep original.
                if (newSize < getFileSizeMB(filePath) || getFileSizeMB(filePath) > 2) {
                    fs.unlinkSync(filePath);
                    fs.renameSync(tempPath, filePath);
                    resolve(true);
                } else {
                    console.log(`⚠️  Compressed file larger/similar? Keeping original.`);
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
    const images = files.filter(f => f.match(/\.(jpg|jpeg|png)$/i));

    console.log(`Found ${images.length} images.`);

    for (const image of images) {
        const filePath = path.join(MEDIA_DIR, image);
        if (getFileSizeMB(filePath) > TARGET_SIZE_MB) {
            try {
                await compressImage(filePath);
            } catch (e) {
                console.error(e);
            }
        } else {
            console.log(`⏭️  Skipping ${image} (Already < ${TARGET_SIZE_MB} MB)`);
        }
    }
}

main();
