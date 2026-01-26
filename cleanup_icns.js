const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public/assets/icons-library');
if (!fs.existsSync(dir)) process.exit(0);

const files = fs.readdirSync(dir);
let deletedCount = 0;

// Find all .webp files
const webpFiles = new Set(files.filter(f => f.endsWith('.webp')).map(f => f.replace('.webp', '')));

files.forEach(file => {
    if (file.endsWith('.icns')) {
        const base = file.replace('.icns', '');
        // If a webp version exists, delete the icns
        if (webpFiles.has(base)) {
            try {
                fs.unlinkSync(path.join(dir, file));
                console.log('Deleted redundant source:', file);
                deletedCount++;
            } catch (e) {
                console.error('Failed to delete:', file);
            }
        }
    }
});

console.log(`Cleanup complete. Deleted ${deletedCount} redundant .icns files.`);
