/**
 * Generate Poster Images from Video Files
 * Extracts the first frame from each .mp4 file and saves as .jpg
 * 
 * Usage: node scripts/generate-video-posters.js
 * Requires: ffmpeg installed and in PATH
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'projects');

// Find all MP4 files
const files = fs.readdirSync(PROJECTS_DIR);
const mp4Files = files.filter(f => f.endsWith('.mp4'));

console.log(`Found ${mp4Files.length} video files to process...`);

mp4Files.forEach(mp4File => {
    const inputPath = path.join(PROJECTS_DIR, mp4File);
    const outputPath = path.join(PROJECTS_DIR, mp4File.replace('.mp4', '.jpg'));

    // Check if poster already exists
    if (fs.existsSync(outputPath)) {
        console.log(`[SKIP] ${mp4File} - poster already exists`);
        return;
    }

    try {
        // Extract first frame using ffmpeg
        // -y: overwrite output
        // -i: input file
        // -vframes 1: extract only 1 frame
        // -q:v 2: quality (1-31, lower = better)
        const cmd = `ffmpeg -y -i "${inputPath}" -vframes 1 -q:v 2 "${outputPath}"`;
        execSync(cmd, { stdio: 'ignore' });

        console.log(`[OK] ${mp4File} -> ${path.basename(outputPath)}`);
    } catch (err) {
        console.error(`[ERROR] ${mp4File}: ${err.message}`);
    }
});

console.log('\nDone! Poster images generated.');
