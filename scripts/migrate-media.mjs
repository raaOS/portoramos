import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const DUMP_DIR = path.join(PROJECT_ROOT, 'temp_cloudinary_dump');
const TARGET_DIR = path.join(PROJECT_ROOT, 'public/assets/media');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/data');

const FILES_TO_UPDATE = [
    path.join(DATA_DIR, 'projects.json'),
    path.join(DATA_DIR, 'about.json'),
    path.join(DATA_DIR, 'fallback-content.ts'),
];

// Ensure target dir exists
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Get all files in dump
const dumpFiles = fs.readdirSync(DUMP_DIR);
console.log(`Found ${dumpFiles.length} files in dump directory.`);

let migratedCount = 0;

function migrateUrl(url) {
    if (typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;

    // Extract filename from URL
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('?')[0]; // Remove query params if any

    // Check if file exists in dump
    const foundFile = dumpFiles.find(f => f.includes(filename));

    if (foundFile) {
        const sourcePath = path.join(DUMP_DIR, foundFile);
        const targetPath = path.join(TARGET_DIR, foundFile);

        if (!fs.existsSync(targetPath)) {
            fs.copyFileSync(sourcePath, targetPath);
            migratedCount++;
        }
        return `/assets/media/${foundFile}`;
    } else {
        console.warn(`⚠️ File not found in dump for URL: ${url}`);
        return url;
    }
}

function processObject(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => processObject(item));
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
            newObj[key] = processObject(value);
        }
        return newObj;
    } else if (typeof obj === 'string') {
        return migrateUrl(obj);
    }
    return obj;
}

// 1. Process JSON files
for (const filePath of FILES_TO_UPDATE) {
    if (filePath.endsWith('.json')) {
        console.log(`Processing ${path.basename(filePath)}...`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const updatedData = processObject(data);
        fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf8');
    } else if (filePath.endsWith('.ts')) {
        console.log(`Processing ${path.basename(filePath)}...`);
        let content = fs.readFileSync(filePath, 'utf8');

        // Simple regex to find cloudinary URLs in TS strings
        const cloudinaryRegex = /https:\/\/res\.cloudinary\.com\/[^\s'"]+/g;
        content = content.replace(cloudinaryRegex, (match) => {
            const parts = match.split('/');
            const filename = parts[parts.length - 1].split('?')[0];
            const foundFile = dumpFiles.find(f => f.includes(filename));
            if (foundFile) {
                // Copy file
                const sourcePath = path.join(DUMP_DIR, foundFile);
                const targetPath = path.join(TARGET_DIR, foundFile);
                if (!fs.existsSync(targetPath)) {
                    fs.copyFileSync(sourcePath, targetPath);
                    migratedCount++;
                }
                return `/assets/media/${foundFile}`;
            }
            return match;
        });
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

console.log(`✅ Migration complete! Migrated ${migratedCount} files.`);
console.log(`Next step: Update src/lib/images.ts to handle local paths.`);
