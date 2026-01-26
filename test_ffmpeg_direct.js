const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const file = path.join(__dirname, 'public/assets/test icon dock.icns');
const outFile = path.join(__dirname, 'test_extracted.jp2');

if (fs.existsSync(file)) {
    const buffer = fs.readFileSync(file);
    let pos = 8;
    while (pos < buffer.length) {
        const type = buffer.toString('utf8', pos, pos + 4);
        const size = buffer.readUInt32BE(pos + 4);

        if (type === 'ic10') {
            const data = buffer.slice(pos + 8, pos + size);
            fs.writeFileSync(outFile, data);
            console.log('Extracted ic10 to test_extracted.jp2');

            // Try ffmpeg
            try {
                // Try executing global ffmpeg or find ffmpeg-static path
                const ffmpegStatic = require('ffmpeg-static');
                console.log('FFmpeg Path:', ffmpegStatic);

                cp.execSync(`"${ffmpegStatic}" -i "${outFile}" test_converted_fmpeg.png`);
                console.log('FFmpeg conversion success!');
            } catch (e) {
                console.error('FFmpeg failed:', e.message);
            }
        }

        pos += size;
        if (size <= 0) break;
    }
}
