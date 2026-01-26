const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public/assets/icons-library');

if (!fs.existsSync(dir)) {
    console.log('Directory not found');
    process.exit(0);
}

const files = fs.readdirSync(dir);
let deletedCount = 0;

files.forEach(file => {
    if (file.includes('_temp')) {
        const fullPath = path.join(dir, file);
        try {
            fs.unlinkSync(fullPath);
            console.log('Deleted:', file);
            deletedCount++;
        } catch (e) {
            console.error('Failed to delete:', file, e.message);
        }
    }
});

console.log(`Cleanup complete. Deleted ${deletedCount} temp files.`);
