
import fs from 'fs';
import path from 'path';
import https from 'https';

const PROJECT_ROOT = process.cwd();
const PROJECTS_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'projects.json');
const ABOUT_PATH = path.join(PROJECT_ROOT, 'src', 'data', 'about.json');
const MEDIA_DIR = path.join(PROJECT_ROOT, 'public', 'assets', 'media');

async function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { });
            reject(err);
        });
    });
}

async function run() {
    console.log('Starting fix...');

    // 1. Recover missing video
    const missingVideoUrl = 'https://res.cloudinary.com/dcb3dslfw/video/upload/v1766857273/AQMRJH0BtqJVJdw_PX1iLNUZuM7OjhI8KOt8dAx5yn6ryPif1yfQ7wrl9s7ZaP3J-J9oYFbOy8QKyVRA8dUAtzm738de-P5C_yuiotv.mp4';
    const missingVideoName = 'tempat-perlindungan-sneaker-surealis-gallery-1.mp4';
    const missingVideoPath = path.join(MEDIA_DIR, missingVideoName);

    if (!fs.existsSync(missingVideoPath)) {
        console.log(`Downloading missing video: ${missingVideoName}...`);
        try {
            await downloadFile(missingVideoUrl, missingVideoPath);
            console.log('Download complete.');
        } catch (e) {
            console.error('Failed to download video:', e);
        }
    } else {
        console.log('Missing video already exists.');
    }

    // 2. Fix projects.json
    console.log('Fixing projects.json...');
    const projectsData = JSON.parse(fs.readFileSync(PROJECTS_PATH, 'utf8'));

    // Remove SyncTest
    projectsData.projects = projectsData.projects.filter(p => !p.slug.toLowerCase().includes('synctest'));

    // Fix gallery item
    const sneakerProject = projectsData.projects.find(p => p.slug === 'tempat-perlindungan-sneaker-surealis');
    if (sneakerProject) {
        const localVideoPath = `/assets/media/${missingVideoName}`;
        sneakerProject.gallery = [localVideoPath];
        if (sneakerProject.galleryItems && sneakerProject.galleryItems.length > 0) {
            sneakerProject.galleryItems[0].src = localVideoPath;
        }
        console.log('Fixed sneaker project gallery.');
    }

    fs.writeFileSync(PROJECTS_PATH, JSON.stringify(projectsData, null, 2));
    console.log('projects.json updated.');

    // 3. Fix about.json
    console.log('Fixing about.json...');
    const aboutData = JSON.parse(fs.readFileSync(ABOUT_PATH, 'utf8'));

    if (aboutData.hero && aboutData.hero.backgroundTrail) {
        aboutData.hero.backgroundTrail.forEach(item => {
            const slug = item.slug;
            const potentialJpg = path.join(MEDIA_DIR, `${slug}-cover.jpg`);
            const potentialMp4 = path.join(MEDIA_DIR, `${slug}-cover.mp4`);

            if (fs.existsSync(potentialJpg)) {
                item.src = `/assets/media/${slug}-cover.jpg`;
            } else if (fs.existsSync(potentialMp4)) {
                item.src = `/assets/media/${slug}-cover.mp4`;
            } else {
                console.warn(`Warning: Could not find media for slug ${slug} in about.json`);
            }
        });
    }

    fs.writeFileSync(ABOUT_PATH, JSON.stringify(aboutData, null, 2));
    console.log('about.json updated.');

    console.log('Fix complete.');
}

run().catch(console.error);
