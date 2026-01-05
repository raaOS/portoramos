import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const MEDIA_DIR = path.join(PROJECT_ROOT, 'public/assets/media');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/data');

const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const ABOUT_FILE = path.join(DATA_DIR, 'about.json');
const FALLBACK_FILE = path.join(DATA_DIR, 'fallback-content.ts');

const missingFiles = [];

function getExtension(filename) {
    const parts = filename.split('.');
    if (parts.length > 1) return '.' + parts.pop();
    return '';
}

function safeRename(oldName, newNameBase) {
    const oldPath = path.join(MEDIA_DIR, oldName);

    if (!fs.existsSync(oldPath)) {
        return null; // File missing
    }

    const ext = getExtension(oldName);
    let newName = `${newNameBase}${ext}`;
    let newPath = path.join(MEDIA_DIR, newName);

    // Avoid overwriting if file already exists with same name (unless it's the same file)
    if (oldName === newName) return `/assets/media/${newName}`;

    if (fs.existsSync(newPath)) {
        // If target exists, append a number
        let i = 1;
        while (fs.existsSync(newPath)) {
            newName = `${newNameBase}-${i}${ext}`;
            newPath = path.join(MEDIA_DIR, newName);
            i++;
        }
    }

    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${oldName} -> ${newName}`);
    return `/assets/media/${newName}`;
}

function processUrl(url, slug, type, index = 0) {
    if (!url) return url;

    // If it's already a local path
    if (url.startsWith('/assets/media/')) {
        const oldFilename = path.basename(url);
        // Don't rename if it already looks like the slate (starts with slug)
        if (oldFilename.startsWith(slug)) return url;

        const newNameBase = `${slug}-${type}${index > 0 ? '-' + index : ''}`;
        const newUrl = safeRename(oldFilename, newNameBase);

        if (newUrl) return newUrl;

        // If safeRename returned null, file is missing
        missingFiles.push({ slug, url: oldFilename, type });
        return url;
    }

    // If it's still a Cloudinary URL
    if (url.includes('res.cloudinary.com')) {
        const parts = url.split('/');
        const filename = parts[parts.length - 1].split('?')[0];

        // Check if we have this file in media dir under its original name
        if (fs.existsSync(path.join(MEDIA_DIR, filename))) {
            const newNameBase = `${slug}-${type}${index > 0 ? '-' + index : ''}`;
            const newUrl = safeRename(filename, newNameBase);
            if (newUrl) return newUrl;
        }

        missingFiles.push({ slug, url, type });
        return url;
    }

    return url;
}

// --- Process Projects ---
const projectsData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
projectsData.projects = projectsData.projects.map(p => {
    if (p.cover) {
        p.cover = processUrl(p.cover, p.slug, 'cover');
    }

    if (p.comparison) {
        if (p.comparison.beforeImage) p.comparison.beforeImage = processUrl(p.comparison.beforeImage, p.slug, 'comparison-before');
        if (p.comparison.afterImage) p.comparison.afterImage = processUrl(p.comparison.afterImage, p.slug, 'comparison-after');
    }

    if (p.gallery && Array.isArray(p.gallery)) {
        p.gallery = p.gallery.map((url, i) => processUrl(url, p.slug, 'gallery', i + 1));
    }

    if (p.galleryItems && Array.isArray(p.galleryItems)) {
        p.galleryItems = p.galleryItems.map((item, i) => {
            if (item.src) item.src = processUrl(item.src, p.slug, 'gallery', i + 1);
            return item;
        });
    }

    return p;
});
fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projectsData, null, 2));

// --- Process About ---
const aboutData = JSON.parse(fs.readFileSync(ABOUT_FILE, 'utf8'));
if (aboutData.hero && aboutData.hero.backgroundTrail) {
    aboutData.hero.backgroundTrail = aboutData.hero.backgroundTrail.map((item, i) => {
        if (item.src) item.src = processUrl(item.src, item.slug || 'about-trail', 'hero-trail', i + 1);
        return item;
    });
}
fs.writeFileSync(ABOUT_FILE, JSON.stringify(aboutData, null, 2));


// --- Report ---
console.log('\n--- MIGRATION FIX REPORT ---');
if (missingFiles.length > 0) {
    console.log('⚠️ MISSING FILES (Please download these manually):');
    missingFiles.forEach(f => {
        console.log(`- Project: ${f.slug} | Type: ${f.type} | URL/File: ${f.url}`);
    });
} else {
    console.log('✅ All files accounted for and renamed!');
}
