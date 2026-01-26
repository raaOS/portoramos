const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const sharp = require('sharp');
const ffmpegPath = require('ffmpeg-static');

const filePath = 'c:\\Users\\USER\\Documents\\portfolio-shared\\public\\assets\\icons-library\\icnsFile_a7181b3ed7f1a02b7f9256db3147a2d1_Nano_Banana__Google_Gemini_2.5_Flash__Yellow_Banana__Fruit__Food__Liquid_Glass_.icns';
const outputPath = 'c:\\Users\\USER\\Documents\\portfolio-shared\\public\\assets\\icons-library\\test_converted_banana.webp';

async function convertBufferWithFFmpeg(buffer) {
    return new Promise((resolve, reject) => {
        // Spawn ffmpeg to convert stdin (jp2) to standard output (png)
        const ffmpeg = spawn(ffmpegPath, [
            '-f', 'image2pipe', // Input format piped
            '-i', 'pipe:0',     // Read from stdin
            '-f', 'image2pipe', // Output raw image stream
            '-c:v', 'png',      // Convert to PNG
            'pipe:1'            // Write to stdout
        ]);

        let outputBuffer = Buffer.alloc(0);
        let errorBuffer = Buffer.alloc(0);

        ffmpeg.stdout.on('data', (chunk) => {
            outputBuffer = Buffer.concat([outputBuffer, chunk]);
        });

        ffmpeg.stderr.on('data', (chunk) => {
            errorBuffer = Buffer.concat([errorBuffer, chunk]);
        });

        ffmpeg.on('close', (code) => {
            if (code === 0 && outputBuffer.length > 0) {
                resolve(outputBuffer);
            } else {
                reject(new Error(`FFmpeg exited with code ${code}: ${errorBuffer.toString()}`));
            }
        });

        // Write the JP2 buffer to ffmpeg stdin
        ffmpeg.stdin.write(buffer);
        ffmpeg.stdin.end();
    });
}

async function testConversion() {
    console.log(`Reading ${filePath}...`);
    try {
        const buffer = fs.readFileSync(filePath);

        // ... (Same parsing logic as before) ...
        const iconTypes = ['ic10', 'ic09', 'ic08', 'ic14', 'ic13', 'ic07', 'icp6', 'icp5', 'icp4'];

        let bestCandidate = null;
        let pos = 8;
        while (pos < buffer.length) {
            const type = buffer.toString('utf8', pos, pos + 4);
            const size = buffer.readUInt32BE(pos + 4);

            if (iconTypes.includes(type)) {
                const blockData = buffer.slice(pos + 8, pos + size);
                const isPng = blockData[0] === 0x89 && blockData[1] === 0x50;
                const isJP2 = blockData[0] === 0x00 && blockData[4] === 0x6A;

                if (isPng || isJP2) {
                    // Just take the first valid one or largest
                    if (!bestCandidate || size > bestCandidate.size) {
                        bestCandidate = { type, size, buffer: blockData, isJP2 };
                    }
                }
            }
            pos += size;
            if (size <= 0) break;
        }

        if (!bestCandidate) {
            console.error('No candidate block found.');
            return;
        }

        console.log(`Selected block: ${bestCandidate.type} (Size: ${bestCandidate.size}, JP2: ${bestCandidate.isJP2})`);

        let imageBufferForSharp = bestCandidate.buffer;

        // If JP2 and Sharp failed (we know it fails), try FFmpeg
        if (bestCandidate.isJP2) {
            console.log('Attempting conversion of JP2 block via FFmpeg...');
            try {
                imageBufferForSharp = await convertBufferWithFFmpeg(bestCandidate.buffer);
                console.log('FFmpeg conversion to PNG success! Buffer size:', imageBufferForSharp.length);
            } catch (ffmpegErr) {
                console.error('FFmpeg failed:', ffmpegErr.message);
                return;
            }
        }

        await sharp(imageBufferForSharp)
            .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(outputPath);

        console.log(`✅ Success! Converted to ${outputPath}`);

    } catch (e) {
        console.error('Error:', e);
    }
}

testConversion();
