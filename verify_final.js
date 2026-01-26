const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const sharp = require('sharp');
const ffmpegPath = require('ffmpeg-static');

// Mock helpers from API
const decodeJp2WithFfmpeg = async (inBuffer) => {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath, [
            '-f', 'image2pipe', '-i', 'pipe:0',
            '-f', 'image2pipe', '-c:v', 'png',
            'pipe:1'
        ]);

        const chunks = [];
        ffmpeg.stdout.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        ffmpeg.on('close', (code) => {
            if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks));
            else reject(new Error(`FFmpeg exited with code ${code}`));
        });

        ffmpeg.stdin.write(inBuffer);
        ffmpeg.stdin.end();
    });
};

const filePath = 'c:\\Users\\USER\\Documents\\portfolio-shared\\public\\assets\\icons-library\\icnsFile_9a9794114b8e46d4e5061a0ca9f119c0_Launchpad.icns';
const outputPath = 'c:\\Users\\USER\\Documents\\portfolio-shared\\public\\assets\\icons-library\\final_verification_launchpad.webp';

async function verifyFullLogic() {
    console.log(`Reading ${filePath}...`);
    const buffer = fs.readFileSync(filePath);

    // Candidates extraction
    const iconTypes = ['ic10', 'ic09', 'ic08', 'ic14', 'ic13', 'ic07', 'icp6', 'icp5', 'icp4'];
    const candidates = [];
    let pos = 8;
    while (pos < buffer.length) {
        const type = buffer.toString('utf8', pos, pos + 4);
        const size = buffer.readUInt32BE(pos + 4);
        if (iconTypes.includes(type)) {
            const blockData = buffer.slice(pos + 8, pos + size);
            candidates.push({ type, size, buffer: blockData });
        }
        pos += size;
        if (size <= 0) break;
    }
    candidates.sort((a, b) => b.size - a.size);

    // Conversion Loop
    for (const candidate of candidates) {
        console.log(`Trying block ${candidate.type}, Size: ${candidate.size}`);
        try {
            let inputBuffer = candidate.buffer;
            const isJP2 = inputBuffer[0] === 0x00 && inputBuffer[4] === 0x6A;

            if (isJP2) {
                console.log(`   -> JP2 detected! Piping to FFmpeg...`);
                inputBuffer = await decodeJp2WithFfmpeg(inputBuffer);
                console.log(`   -> FFmpeg Success! PNG Buffer: ${inputBuffer.length}`);
            }

            await sharp(inputBuffer)
                .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 85 })
                .toFile(outputPath);

            console.log(`✅ Success! Created ${outputPath}`);
            return;
        } catch (e) {
            console.error(`   -> Failed: ${e.message}`);
        }
    }
    console.error('❌ All candidates failed.');
}

verifyFullLogic();
