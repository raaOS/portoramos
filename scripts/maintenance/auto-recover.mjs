import fs from 'fs';
import path from 'path';
import https from 'https';

const PROJECT_ROOT = process.cwd();
const MEDIA_DIR = path.join(PROJECT_ROOT, 'public/assets/media');
// Use the REMOTE file as the source of truth for Cloudinary URLs
const SOURCE_FILE = path.join(PROJECT_ROOT, 'src/data/projects_REMOTE_2014.json');
const PROJECTS_FILE = path.join(PROJECT_ROOT, 'src/data/projects.json');

const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
const currentData = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));

// Helper to download file
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
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
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

// Map slugs to projects for easy lookup
const projectMap = new Map();
currentData.projects.forEach(p => projectMap.set(p.slug, p));

async function main() {
    console.log('--- STARTING AUTO-RECOVERY ---');
    let recoveredCount = 0;

    for (const srcProject of sourceData.projects) {
        const slug = srcProject.slug;
        const currentProject = projectMap.get(slug);

        // Check main cover
        if (srcProject.cover?.includes('res.cloudinary.com')) {
            // Find what the filename *should* be in the new system
            // Usually [slug]-cover.ext or similar.
            // But simpler: download to original name, then let rename script handle it.

            const originalName = srcProject.cover.split('/').pop().split('?')[0];
            const destPath = path.join(MEDIA_DIR, originalName);

            // Also check if the *target* renamed file exists (e.g. slug-cover.mp4)
            // If the current project has a local path, checking that is better.
            let needsDownload = true;
            if (currentProject?.cover?.startsWith('/assets/media/')) {
                const currentLocalName = currentProject.cover.split('/').pop();
                if (fs.existsSync(path.join(MEDIA_DIR, currentLocalName))) {
                    needsDownload = false;
                }
            }

            if (needsDownload && !fs.existsSync(destPath)) {
                console.log(`📥 Downloading missing cover for ${slug}...`);
                try {
                    await downloadFile(srcProject.cover, destPath);
                    console.log(`   ✅ Saved to ${originalName}`);
                    recoveredCount++;
                } catch (err) {
                    console.error(`   ❌ Failed: ${err.message}`);
                }
            }
        }
    }

    console.log(`\n--- RECOVERY COMPLETE ---`);
    console.log(`Recovered ${recoveredCount} files.`);
    console.log('Now execute "node scripts/rename-and-fix.mjs" to rename them properly!');
}

main();
