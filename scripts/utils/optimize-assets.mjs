
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegStatic);

const MEDIA_DIR = path.join(process.cwd(), 'public', 'assets', 'media');
// We will output optimized files to the SAME directory but with a prefix or overwrite?
// "Extreme" means overwrite or replace usage. 
// A safer "extreme" is to create a parallel "_opt" file and swizzle logic? 
// No, user wants GitHub storage to equal Cloudinary. Cloudinary delivers optimized. 
// We should Overwrite the originals (if we are brave) or create WebP sidecars.
// Updating code to look for .webp is annoying. 
// STRATEGY: 
// 1. Detect large PNG/JPG. Convert to WebP. Delete original? No, keeps backup.
// 2. Ideally, we rename them to satisfy existing imports? imports usually are hardcoded strings.
// Let's create an "optimized" copy and keep the original filename for now but CHANGE THE EXTENSION?
// Actually, safest is to optimization IN PLACE if extension matches, or convert to WebP and update code?
// Updating code is hard.
// Let's stick to: RESIZE and COMPRESS existing files in place (keep jpg as jpg, but smaller).
// AND generate WebP variants.

async function optimizeImages() {
    console.log('🖼️ Starting Image Optimization...');

    async function processDir(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                await processDir(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();

                // IMAGES
                if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                    console.log(`Processing: ${entry.name}`);

                    try {
                        const metadata = await sharp(fullPath).metadata();

                        // Extreme Check: If width > 1600, resize it.
                        if (metadata.width > 1600) {
                            console.log(`  -> Resizing from ${metadata.width}px to 1600px`);
                            const buffer = await sharp(fullPath)
                                .resize(1600, null, { withoutEnlargement: true })
                                .jpeg({ quality: 80, mozjpeg: true }) // safe fallback
                                .toBuffer();

                            await fs.writeFile(fullPath, buffer);
                            console.log('  -> Overwritten with optimized version.');
                        } else {
                            // Just compress
                            const buffer = await sharp(fullPath)
                                .jpeg({ quality: 80, mozjpeg: true })
                                .png({ quality: 80, compressionLevel: 8 })
                                .toBuffer();
                            await fs.writeFile(fullPath, buffer);
                        }
                    } catch (e) {
                        console.error(`  ❌ Failed to optimize ${entry.name}:`, e);
                    }
                }

                // VIDEOS
                if (['.mp4', '.mov'].includes(ext)) {
                    // Check size?
                    // ffmpeg logic here is heavy. Let's just log for now or do a simple CRF 28 pass aka "WhatsApp Quality"
                    console.log(`🎥 Found video: ${entry.name} - Run manual video compression if needed.`);
                }
            }
        }
    }

    await processDir(MEDIA_DIR);
    console.log('✅ Optimization Complete!');
}

optimizeImages();
