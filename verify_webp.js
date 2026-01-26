const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\USER\\Documents\\portfolio-shared\\public\\assets\\icons-library';

fs.readdir(dir, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    files.forEach(file => {
        if (!file.endsWith('.webp')) return;

        const p = path.join(dir, file);
        const buffer = fs.readFileSync(p);
        const header = buffer.toString('hex', 0, 12);

        // RIFF .... WEBP -> 52 49 46 46 .... 57 45 42 50
        const isWebP = header.startsWith('52494646') && header.endsWith('57454250');
        const isIcns = header.startsWith('69636e73'); // 'icns'
        const isPng = header.startsWith('89504e47'); // ‰PNG

        console.log(`${file}: ${isWebP ? 'VALID WEBP' : isIcns ? 'INVALID (ICNS)' : isPng ? 'INVALID (PNG)' : 'INVALID (UNKNOWN)'} [${header}]`);
    });
});
