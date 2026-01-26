const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public/assets/icons-library');
const files = fs.readdirSync(dir);

// Group by unique signature (Hash + Name + Ext)
// Filename format: timestamp-icnsfile-HASH-name.ext
const groups = {};
let junkCount = 0;

files.forEach(file => {
    // 1. Delete test files
    if (file.startsWith('test_')) {
        try {
            fs.unlinkSync(path.join(dir, file));
            console.log('Deleted junk:', file);
            junkCount++;
        } catch (e) { }
        return;
    }

    // 2. Parse hash
    // match[1] = timestamp
    // match[2] = hash
    // match[3] = name + ext
    const match = file.match(/^(\d+)-icnsfile-([a-f0-9]+)-(.+)$/);

    if (match) {
        const timestamp = parseInt(match[1]);
        const hash = match[2];
        const rest = match[3];
        const ext = path.extname(rest);

        // Key is Hash + Extension (to process .icns and .webp separately but keep sync if possible? 
        // Actually, we want to dedup based on content hash.
        // If we have 3 copies of "hash-notes.icns", keep 1.
        // If we have 3 copies of "hash-notes.webp", keep 1.
        const key = `${hash}-${rest}`; // unique content identifier

        if (!groups[key]) groups[key] = [];
        groups[key].push({ file, timestamp });
    }
});

let dupCount = 0;
Object.keys(groups).forEach(key => {
    const versions = groups[key];
    if (versions.length > 1) {
        // Sort descending (newest first)
        versions.sort((a, b) => b.timestamp - a.timestamp);

        // Keep [0], delete the rest
        for (let i = 1; i < versions.length; i++) {
            const fileToDelete = versions[i].file;
            try {
                fs.unlinkSync(path.join(dir, fileToDelete));
                console.log('Deleted duplicate:', fileToDelete);
                dupCount++;
            } catch (e) {
                console.error('Error deleting:', fileToDelete);
            }
        }
    }
});

console.log(`Cleanup Report: Removed ${junkCount} junk files and ${dupCount} duplicates.`);
