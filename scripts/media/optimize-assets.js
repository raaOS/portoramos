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
    const dirs = [PROJECTS_DIR, WALLPAPER_DIR];

    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        console.log(`Checking directory: ${dir}`);
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp4'));

        for (const file of files) {
            const input = path.join(dir, file);
            const output = path.join(dir, file.replace('.mp4', '-opt.mp4'));

            // Skip if optimized version exists
            if (fs.existsSync(output)) continue;

            console.log(`Processing ${file} in ${path.basename(dir)}...`);

            await new Promise((resolve, reject) => {
                ffmpeg(input)
                    .outputOptions([
                        '-c:v libx264',
                        '-crf 28', // Lower quality slightly for size
                        '-preset fast',
                        '-an' // Remove audio for wallpaper/project preview to save space
                    ])
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
