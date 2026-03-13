import { NextRequest, NextResponse } from 'next/server';
import { db, bucket } from '@/lib/firebaseAdmin';
import { checkAdminAuth, validateAdminRequest } from '@/lib/auth';

interface ProjectAsset {
    cover?: string;
    comparison?: { beforeImage?: string; afterImage?: string };
    gallery?: string[];
    galleryItems?: { src?: string }[];
    galleryGroups?: { items?: { src?: string }[] }[];
}

export async function GET(req: NextRequest) {
    try {
        if (!checkAdminAuth(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const usedAssets = new Set<string>();

        // 1. Collect assets from Projects in Firebase
        try {
            const projectsSnap = await db.ref('projects').once('value');
            const firebaseProjects = projectsSnap.val() || {};

            Object.values(firebaseProjects as Record<string, ProjectAsset>).forEach((p) => {
                collectProjectAssets(p, usedAssets);
            });
        } catch (e) {
            console.error('[Audit] Failed to load projects from Firebase:', e);
        }

        // 2. Collect assets from Content (About, Contact, etc.)
        try {
            const contentSnap = await db.ref('content').once('value');
            const content = contentSnap.val() || {};

            // Desktop icons, Sticky notes, etc are in 'content/about'
            if (content.about?.desktop?.icons) {
                (content.about.desktop.icons as { iconUrl?: string }[]).forEach((icon) => {
                    if (icon.iconUrl) usedAssets.add(icon.iconUrl);
                });
            }
            if (content.about?.desktop?.stickyNotes) {
                (content.about.desktop.stickyNotes as { imageUrl?: string }[]).forEach((note) => {
                    if (note.imageUrl) usedAssets.add(note.imageUrl);
                });
            }
            // Contact data
            if (content.contact?.info?.image) usedAssets.add(content.contact.info.image);
        } catch (e) {
            console.error('[Audit] Failed to load content from Firebase:', e);
        }

        // 3. Scan Firebase Storage
        const [files] = await bucket.getFiles({ prefix: 'assets/' });
        const totalFiles = files.length;
        const orphanFiles: Array<{ name: string, inDb: boolean, reason: string }> = [];

        files.forEach(file => {
            const fileName = file.name;
            if (fileName.includes('/.')) return; // Skip dotfiles

            // Construct various path formats to check
            const fullUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
            const encodedName = encodeURIComponent(fileName);

            let isUsed = false;
            usedAssets.forEach(assetUrl => {
                if (assetUrl === fullUrl ||
                    assetUrl.includes(encodedName) ||
                    assetUrl.endsWith(fileName)) {
                    isUsed = true;
                }
            });

            if (!isUsed) {
                orphanFiles.push({
                    name: fileName,
                    inDb: false,
                    reason: 'Not referenced by any project or content in database'
                });
            }
        });

        return NextResponse.json({
            stats: {
                totalUsedAssetsDiscovered: usedAssets.size,
                totalFilesOnStorage: totalFiles,
                orphanFilesCount: orphanFiles.length
            },
            orphanFiles: orphanFiles,
            usedAssetsList: Array.from(usedAssets).slice(0, 50)
        });
    } catch (error) {
        console.error('Audit Error:', error);
        return NextResponse.json({ error: 'Audit Failed' }, { status: 500 });
    }
}

function collectProjectAssets(p: ProjectAsset, usedAssets: Set<string>) {
    if (!p) return;
    if (p.cover) usedAssets.add(p.cover);
    if (p.comparison?.beforeImage) usedAssets.add(p.comparison.beforeImage);
    if (p.comparison?.afterImage) usedAssets.add(p.comparison.afterImage);
    if (p.gallery && Array.isArray(p.gallery)) {
        (p.gallery as string[]).forEach((url) => {
            if (typeof url === 'string') usedAssets.add(url);
        });
    }
    if (p.galleryItems && Array.isArray(p.galleryItems)) {
        (p.galleryItems as { src?: string }[]).forEach((item) => {
            if (item.src) usedAssets.add(item.src);
        });
    }
    if (p.galleryGroups && Array.isArray(p.galleryGroups)) {
        (p.galleryGroups as { items?: { src?: string }[] }[]).forEach((group) => {
            if (group.items && Array.isArray(group.items)) {
                group.items.forEach((item) => {
                    if (item.src) usedAssets.add(item.src);
                });
            }
        });
    }
}

export async function POST(req: NextRequest) {
    try {
        if (!await validateAdminRequest(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { files } = body;

        if (!files || !Array.isArray(files)) {
            return NextResponse.json({ error: 'Invalid files array' }, { status: 400 });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Delete from Firebase Storage
        for (const fileName of files) {
            try {
                const file = bucket.file(fileName);
                const [exists] = await file.exists();
                if (exists) {
                    await file.delete();
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push(`${fileName}: File not found`);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`Failed to delete ${fileName}:`, err);
                results.failed++;
                results.errors.push(`${fileName}: ${message}`);
            }
        }

        return NextResponse.json({
            message: `Cloud cleanup completed: ${results.success} deleted, ${results.failed} failed.`,
            results
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Cleanup failed';
        console.error('Mass cleanup error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
