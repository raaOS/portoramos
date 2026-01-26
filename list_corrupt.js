const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\USER\\Documents\\portfolio-shared\\public\\assets\\icons-library';

fs.readdir(dir, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }

    const corruptFiles = [];

    files.forEach(file => {
        if (!file.endsWith('.webp')) return;

        const p = path.join(dir, file);
        try {
            const buffer = fs.readFileSync(p);
            const header = buffer.toString('hex', 0, 12);

            // WebP magic number: RIFF .... WEBP
            const isWebP = header.startsWith('52494646') && header.endsWith('57454250');

            if (!isWebP) {
                corruptFiles.push(file);
            }
        } catch (e) {
            console.error(`Error reading ${file}:`, e);
        }
    });

    if (corruptFiles.length > 0) {
        console.log("Found Denyut Nadi (Corrupt Files):");
        corruptFiles.forEach(f => console.log(f));
        console.log(`\nTotal: ${corruptFiles.length} files to delete.`);
    } else {
        console.log("No corrupt files found. All clean!");
    }
});
