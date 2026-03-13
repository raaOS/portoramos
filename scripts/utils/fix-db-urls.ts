import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const db = admin.database();

function fixUrl(url: string | undefined): string | undefined {
    if (!url) return url;
    
    // Check if it's an incorrect firebasestorage url missing the assets/ prefix
    const match = url.match(/o\/(?!assets%2F)([^?]+)/);
    if (match) {
        // Prepend assets%2F to the encoded path
        const newUrl = url.replace(/o\/([^?]+)/, 'o/assets%2F$1');
        return newUrl;
    }
    
    // Also check for storage.googleapis.com urls
    const gcsMatch = url.match(/^https?:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/);
    if (gcsMatch) {
        const bucket = gcsMatch[1];
        let filePath = gcsMatch[2];
        if (!filePath.startsWith('assets/')) {
            filePath = `assets/${filePath}`;
        }
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media`;
    }

    return url;
}

async function fixDatabaseUrls() {
    console.log('--- Fixing Database URLs ---');
    try {
        const projectsRef = db.ref('projects');
        const snap = await projectsRef.once('value');
        const projects = snap.val();

        if (!projects) {
            console.log('No projects found in DB.');
            return;
        }

        let updatedCount = 0;
        const updates: Record<string, any> = {};

        for (const [id, project] of Object.entries<any>(projects)) {
            let changed = false;
            const updatedProject = { ...project };

            const fixedCover = fixUrl(project.cover);
            if (fixedCover !== project.cover) {
                updatedProject.cover = fixedCover;
                changed = true;
            }

            if (project.galleryItems) {
                updatedProject.galleryItems = project.galleryItems.map((item: any) => {
                    const fixedSrc = fixUrl(item.src);
                    const fixedPoster = fixUrl(item.poster);
                    if (fixedSrc !== item.src || fixedPoster !== item.poster) changed = true;
                    
                    const newItem = { ...item };
                    if (fixedSrc !== undefined) newItem.src = fixedSrc;
                    else delete newItem.src;
                    
                    if (fixedPoster !== undefined) newItem.poster = fixedPoster;
                    else delete newItem.poster;
                    
                    return newItem;
                });
            }

            if (project.gallery) {
                updatedProject.gallery = project.gallery.map((url: string) => {
                    const fixed = fixUrl(url);
                    if (fixed !== url) changed = true;
                    return fixed;
                });
            }

            if (changed) {
                updates[`projects/${id}`] = updatedProject;
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            console.log(`Fixing URLs for ${updatedCount} projects...`);
            updates['lastUpdated'] = new Date().toISOString();
            await db.ref().update(updates);
            console.log('Database updated successfully.');
        } else {
            console.log('All URLs are already correct.');
        }

    } catch (e) {
        console.error('Error fixing database:', e);
    }
}

fixDatabaseUrls().then(() => process.exit(0));
