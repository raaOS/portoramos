const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const soundsDir = path.join(__dirname, '../../public/sounds');
const tempDir = path.join(soundsDir, 'temp_reencode');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// List of specific files we care about
const files = [
    'startup.wav',
    'click.wav',
    'window-open.wav',
    'window-close.wav',
    'error.wav',
    'notification.wav',
    'drag.wav'
];

console.log(`Using ffmpeg at: ${ffmpegPath}`);

files.forEach(filename => {
    const inputPath = path.join(soundsDir, filename);
    const outputPath = path.join(tempDir, filename);

    if (!fs.existsSync(inputPath)) {
        console.warn(`⚠️  Skipping ${filename}: File not found.`);
        return;
    }

    console.log(`Processing ${filename}...`);

    try {
        // -y = overwrite, -i = input, -acodec pcm_s16le = WAV standard, -ar 44100 = 44.1kHz, -ac 1 = Mono
        const command = `"${ffmpegPath}" -y -i "${inputPath}" -acodec pcm_s16le -ar 44100 -ac 1 "${outputPath}"`;
        execSync(command, { stdio: 'inherit' });

        console.log(`✅ Fixed ${filename}`);
        // Overwrite original
        fs.copyFileSync(outputPath, inputPath);
    } catch (error) {
        console.error(`❌ Error fixing ${filename}:`, error.message);
    }
});

// Cleanup
if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log('✨ All operations completed.');
