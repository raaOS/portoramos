const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public/assets/test icon dock.icns');

if (fs.existsSync(file)) {
    const buffer = fs.readFileSync(file);
    let pos = 8;
    while (pos < buffer.length) {
        const type = buffer.toString('utf8', pos, pos + 4);
        const size = buffer.readUInt32BE(pos + 4);
        console.log(`Block: ${type}, Size: ${size}`);

        if (type === 'ic10') {
            const data = buffer.slice(pos + 8, pos + 8 + 16); // First 16 bytes of data
            console.log('ic10 Data Header:', data.toString('hex'));
        }

        pos += size;
        if (size <= 0) break;
    }
}
