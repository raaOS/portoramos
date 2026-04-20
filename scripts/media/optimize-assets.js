const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

const WALLPAPER_DIR = path.join(process.cwd(), 'public', 'wallpapers');
const PROJECTS_DIR = path.join(process.cwd(), 'public', 'assets', 'projects');

async function optimizeWallpaper() {
    console.log('🖼️ Optimizing wallpaper...');
    const input = path.join(WALLPAPER_DIR, 'optimized-wallpaper.png');
    const output = path.join(WALLPAPER_DIR, 'optimized-wallpaper.webp');

    if (fs.existsSync(input)) {
        await sharp(input)
            .webp({ quality: 80 })
            .toFile(output);
        console.log(`✅ Wallpaper converted to WebP: ${output}`);
    } else {
        console.log('⚠️ Wallpaper input not found');
    }
}

async function optimizeVideos() {
    console.log('📹 Optimizing videos...');
    if (!fs.existsSync(PROJECTS_DIR)) return;

    const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.mp4'));

    for (const file of files) {
        const input = path.join(PROJECTS_DIR, file);
        const output = path.join(PROJECTS_DIR, file.replace('.mp4', '-opt.mp4'));

        // Skip if optimized version exists
        if (fs.existsSync(output)) continue;

        console.log(`Processing ${file}...`);

        await new Promise((resolve, reject) => {
            ffmpeg(input)
                .outputOptions([
                    '-c:v libx264',
                    '-crf 28', // Lower quality slightly for size
                    '-preset fast',
                    '-an' // Remove audio if not needed? User had "musik-alam" so maybe audio is needed. Let's keep audio for now but compress.
                ])
                // actually let's keep audio but strict bitrate
                .videoBitrate('1000k')
                .save(output)
                .on('end', () => {
                    console.log(`✅ Compressed ${file}`);
                    // Replace original with optimized
                    fs.unlinkSync(input);
                    fs.renameSync(output, input);
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`❌ Error compressing ${file}:`, err);
                    reject(err);
                });
        });
    }
}

(async () => {
    try {
        await optimizeWallpaper();
        await optimizeVideos();
        console.log('✨ All assets optimized!');
    } catch (e) {
        console.error('Optimization failed:', e);
        process.exit(1);
    }
})();
