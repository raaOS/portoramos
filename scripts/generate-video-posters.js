/**
 * Generate poster images (.jpg) from video files (.mp4)
 * Uses FFmpeg to extract frame at 0.5 seconds
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECTS_DIR = path.join(process.cwd(), 'public/assets/projects');

// Check if FFmpeg is installed
try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
} catch (e) {
    console.error('❌ FFmpeg is not installed. Please install FFmpeg first:');
    console.error('   Windows: choco install ffmpeg');
    console.error('   Mac: brew install ffmpeg');
    console.error('   Linux: sudo apt install ffmpeg');
    process.exit(1);
}

// Get all .mp4 files
const files = fs.readdirSync(PROJECTS_DIR);
const mp4Files = files.filter(f => f.endsWith('.mp4'));

console.log(`Found ${mp4Files.length} video files`);
console.log('Generating posters...\n');

let successCount = 0;
let failCount = 0;

for (const mp4File of mp4Files) {
    const baseName = mp4File.replace('.mp4', '');
    const jpgFile = `${baseName}.jpg`;
    const mp4Path = path.join(PROJECTS_DIR, mp4File);
    const jpgPath = path.join(PROJECTS_DIR, jpgFile);

    // Skip if poster already exists
    if (fs.existsSync(jpgPath)) {
        console.log(`⏭️  ${jpgFile} already exists, skipping`);
        continue;
    }

    try {
        // Extract frame at 0.5 seconds, scale to 720px width (maintain aspect ratio)
        const cmd = `ffmpeg -i "${mp4Path}" -ss 00:00:00.500 -vframes 1 -q:v 2 -vf "scale=720:-1" "${jpgPath}"`;
        execSync(cmd, { stdio: 'ignore' });

        console.log(`✅ Generated: ${jpgFile}`);
        successCount++;
    } catch (error) {
        console.error(`❌ Failed: ${mp4File}`);
        failCount++;
    }
}

console.log(`\n📊 Summary:`);
console.log(`   Success: ${successCount}`);
console.log(`   Failed: ${failCount}`);
console.log(`   Skipped: ${mp4Files.length - successCount - failCount}`);
console.log(`\nNext steps:`);
console.log('1. New .jpg files generated locally.');
console.log('2. Upload to Firebase Storage for production use.');
