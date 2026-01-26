const fs = require('fs');
const path = require('path');

const filePath = 'public/assets/test icon incs/icnsFile_9a9794114b8e46d4e5061a0ca9f119c0_Launchpad.icns';

function inspect() {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }

    const buffer = fs.readFileSync(filePath);
    console.log('File size:', buffer.length);
    console.log('Header:', buffer.toString('utf8', 0, 4));
    const fileSize = buffer.readUInt32BE(4);
    console.log('Declared Size:', fileSize);

    let pos = 8;
    while (pos < buffer.length) {
        const type = buffer.toString('utf8', pos, pos + 4);
        const size = buffer.readUInt32BE(pos + 4);

        const blockData = buffer.slice(pos + 8, pos + size);
        const isPng = blockData[0] === 0x89 && blockData[1] === 0x50;
        const isJP2 = blockData[0] === 0x00 && blockData[4] === 0x6A;

        console.log(`Block: ${type} | Size: ${size} | PNG: ${isPng} | JP2: ${isJP2}`);

        pos += size;
        if (size <= 0) break;
    }
}

inspect();
