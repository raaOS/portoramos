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
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
}

const db = admin.database();
const bucket = admin.storage().bucket();

async function moveFile(oldPath: string, newPath: string) {
    if (oldPath === newPath) return;
    try {
        const file = bucket.file(oldPath);
        const [exists] = await file.exists();
        if (exists) {
            console.log(`Moving ${oldPath} -> ${newPath}`);
            await file.move(newPath);
        }
    } catch (e) {
        console.warn(`Move failed: ${oldPath} -> ${newPath}`, (e instanceof Error ? e.message : e));
    }
}

function getCorrectPath(originalPath: string, type: 'project' | 'icon' | 'media'): string {
    const filename = originalPath.split('/').pop() || '';
    const cleanName = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '-');

    if (type === 'project') return `assets/projects/${cleanName}`;
    if (type === 'icon') return `assets/icons-library/${cleanName}`;
    return `assets/media/${cleanName}`;
}

async function beautifyFirebase() {
    console.log('--- Starting Deep Firebase Beautification ---');

    try {
        // 1. Audit Projects
        const projectsSnap = await db.ref('projects').once('value');
        const projects = projectsSnap.val() || {};
        const projectUpdates: Record<string, unknown> = {};

        for (const [id, p] of Object.entries(projects)) {
            let changed = false;
            const updatedProject = { ...(p as Record<string, unknown>) };

            // Normalize & Move cover
            if (updatedProject.cover) {
                let currentPath = '';
                const coverUrl = String(updatedProject.cover);
                if (coverUrl.includes('/o/')) {
                    const parts = coverUrl.split('/o/');
                    currentPath = decodeURIComponent(parts[1].split('?')[0]);
                } else if (coverUrl.startsWith('/')) {
                    currentPath = coverUrl.substring(1);
                } else {
                    currentPath = coverUrl;
                }

                if (currentPath && !currentPath.startsWith('http')) {
                    const expectedPath = getCorrectPath(currentPath, 'project');
                    if (currentPath !== expectedPath) {
                        await moveFile(currentPath, expectedPath);
                        updatedProject.cover = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(expectedPath)}?alt=media`;
                        changed = true;
                    } else if (!coverUrl.startsWith('http')) {
                        // Just normalize to full URL
                        updatedProject.cover = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(currentPath)}?alt=media`;
                        changed = true;
                    }
                }
            }

            // Normalize & Move gallery items
            if (updatedProject.galleryItems && Array.isArray(updatedProject.galleryItems)) {
                for (let i = 0; i < updatedProject.galleryItems.length; i++) {
                    const item = updatedProject.galleryItems[i];
                    if (item.src) {
                        let currentPath = '';
                        if (item.src.includes('/o/')) {
                            const parts = item.src.split('/o/');
                            currentPath = decodeURIComponent(parts[1].split('?')[0]);
                        } else if (item.src.startsWith('/')) {
                            currentPath = item.src.substring(1);
                        } else {
                            currentPath = item.src;
                        }

                        if (currentPath && !currentPath.startsWith('http')) {
                            const expectedPath = getCorrectPath(currentPath, 'project');
                            if (currentPath !== expectedPath) {
                                await moveFile(currentPath, expectedPath);
                                item.src = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(expectedPath)}?alt=media`;
                                changed = true;
                            } else if (!item.src.startsWith('http')) {
                                item.src = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(currentPath)}?alt=media`;
                                changed = true;
                            }
                        }
                    }
                }
            }

            if (changed) {
                projectUpdates[id] = updatedProject;
            }
        }

        if (Object.keys(projectUpdates).length > 0) {
            console.log(`Updating ${Object.keys(projectUpdates).length} projects with neat URLs...`);
            await db.ref('projects').update(projectUpdates);
        }

        // 2. Audit Content (About, Desktop Icons, Sticky Notes)
        const contentSnap = await db.ref('content').once('value');
        const content = contentSnap.val() || {};
        let contentChanged = false;

        if (content.about?.desktop?.icons) {
            for (let i = 0; i < content.about.desktop.icons.length; i++) {
                const icon = content.about.desktop.icons[i];
                if (icon.iconUrl) {
                    let currentPath = '';
                    if (icon.iconUrl.includes('/o/')) {
                        const parts = icon.iconUrl.split('/o/');
                        currentPath = decodeURIComponent(parts[1].split('?')[0]);
                    } else if (icon.iconUrl.startsWith('/')) {
                        currentPath = icon.iconUrl.substring(1);
                    } else {
                        currentPath = icon.iconUrl;
                    }

                    if (currentPath && !currentPath.startsWith('http')) {
                        const expectedPath = getCorrectPath(currentPath, 'icon');
                        if (currentPath !== expectedPath) {
                            await moveFile(currentPath, expectedPath);
                            icon.iconUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(expectedPath)}?alt=media`;
                            contentChanged = true;
                        } else if (!icon.iconUrl.startsWith('http')) {
                            icon.iconUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(currentPath)}?alt=media`;
                            contentChanged = true;
                        }
                    }
                }
            }
        }

        if (contentChanged) {
            console.log('Updating content with neat URLs...');
            await db.ref('content').set(content);
        }

        // 3. Remove temporary/migration junk keys
        const rootSnap = await db.ref('/').once('value');
        const rootKeys = Object.keys(rootSnap.val() || {});
        const keysToDelete = ['temp_seed', 'migration_log', 'old_projects', 'debug_info'].filter(k => rootKeys.includes(k));

        for (const key of keysToDelete) {
            console.log(`Deleting junk key: ${key}`);
            await db.ref(key).remove();
        }

        // 4. Storage Orphan Cleanup
        console.log('Running final orphan asset cleanup...');
        const usedAssets = new Set<string>();

        // Collect from Projects
        for (const p of Object.values(projects)) {
            const proj = p as { cover?: string; galleryItems?: { src?: string }[] };
            if (proj.cover) usedAssets.add(proj.cover);
            if (proj.galleryItems) {
                proj.galleryItems.forEach((item) => {
                    if (item.src) usedAssets.add(item.src);
                });
            }
        }

        // Collect from Content
        if (content.about?.desktop?.icons) {
            (content.about.desktop.icons as { iconUrl?: string }[]).forEach((icon) => {
                if (icon.iconUrl) usedAssets.add(icon.iconUrl);
            });
        }
        if (content.contact?.info?.image) usedAssets.add(content.contact.info.image);

        // Scan Storage
        const [files] = await bucket.getFiles({ prefix: 'assets/' });
        let deletedCount = 0;

        for (const file of files) {
            const fileName = file.name;
            if (fileName.includes('/.')) continue;

            const fullUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

            let isUsed = false;
            usedAssets.forEach(url => {
                if (url === fullUrl || url.includes(encodeURIComponent(fileName))) {
                    isUsed = true;
                }
            });

            if (!isUsed) {
                console.log(`Deleting orphan asset: ${fileName}`);
                await file.delete();
                deletedCount++;
            }
        }

        console.log(`--- Beautification Completed: ${deletedCount} orphans removed ---`);
    } catch (error) {
        console.error('Beautification Failed:', error);
    }
}

beautifyFirebase().then(() => process.exit(0));
