import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const PROJECTS_FILE = path.join(PROJECT_ROOT, 'src/data/projects.json');

const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));

let missingCount = 0;
let totalCount = 0;

function checkFile(url, slug, context) {
    if (!url) return;
    totalCount++;

    if (url.startsWith('https://res.cloudinary.com')) {
        console.warn(`⚠️ [${slug}] Still using Cloudinary: ${context} -> ${url}`);
        missingCount++;
        return;
    }

    if (url.startsWith('/')) {
        const fullPath = path.join(PUBLIC_DIR, url);
        if (!fs.existsSync(fullPath)) {
            console.error(`❌ [${slug}] BROKEN LINK: ${context} -> ${url}`);
            missingCount++;
        } else {
            // console.log(`✅ [${slug}] OK: ${context}`);
        }
    }
}

console.log('--- Verifying Media Integrity ---');

projectsData.projects.forEach(p => {
    checkFile(p.cover, p.slug, 'cover');

    if (p.comparison) {
        checkFile(p.comparison.beforeImage, p.slug, 'comparison.beforeImage');
        checkFile(p.comparison.afterImage, p.slug, 'comparison.afterImage');
    }

    if (p.gallery) {
        p.gallery.forEach((g, i) => checkFile(g, p.slug, `gallery[${i}]`));
    }

    if (p.galleryItems) {
        p.galleryItems.forEach((g, i) => checkFile(g.src, p.slug, `galleryItems[${i}].src`));
    }
});

console.log(`\nVerified ${totalCount} media references.`);
if (missingCount === 0) {
    console.log('✅ ALL MEDIA FILES EXIST ON DISK!');
} else {
    console.log(`❌ Found ${missingCount} missing/broken files.`);
}
