const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const filePath = 'c:\\Users\\USER\\Documents\\portfolio-shared\\public\\assets\\icons-library\\icnsFile_9a9794114b8e46d4e5061a0ca9f119c0_Launchpad.icns';
const outputPath = 'c:\\Users\\USER\\Documents\\portfolio-shared\\public\\assets\\icons-library\\test_converted_launchpad.webp';

async function testConversion() {
    console.log(`Reading ${filePath}...`);
    try {
        const buffer = fs.readFileSync(filePath);

        if (buffer.toString('utf8', 0, 4) !== 'icns') {
            console.error('Not a valid ICNS file');
            return;
        }

        const iconTypes = [
            'ic10', 'ic09', 'ic08', 'ic14', 'ic13', 'ic07',
            'icp6', 'icp5', 'icp4'
        ];

        const candidates = [];
        let pos = 8;
        while (pos < buffer.length) {
            const type = buffer.toString('utf8', pos, pos + 4);
            const size = buffer.readUInt32BE(pos + 4);

            if (iconTypes.includes(type)) {
                const blockData = buffer.slice(pos + 8, pos + size);
                const isPng = blockData[0] === 0x89 && blockData[1] === 0x50;
                const isJP2 = blockData[0] === 0x00 && blockData[4] === 0x6A;

                if (isPng || isJP2) {
                    candidates.push({ type, size, buffer: blockData, format: isPng ? 'PNG' : 'JP2' });
                }
            }
            pos += size;
            if (size <= 0) break;
        }

        candidates.sort((a, b) => b.size - a.size);
        console.log(`Found ${candidates.length} candidates:`, candidates.map(c => `${c.type} (${c.format}, ${c.size})`));

        let success = false;
        for (const candidate of candidates) {
            console.log(`Trying to convert ${candidate.type}...`);
            try {
                await sharp(candidate.buffer)
                    .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 85 })
                    .toFile(outputPath);

                console.log(`✅ Success! Converted to ${outputPath}`);
                success = true;
                break;
            } catch (e) {
                console.error(`❌ Failed ${candidate.type}:`, e.message);
            }
        }

        if (!success) {
            console.error('❌ Failed to convert any block.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

testConversion();
