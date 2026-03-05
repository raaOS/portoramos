
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { githubService } from '@/lib/github';
import { validateAdminRequest } from '@/lib/auth';
import { allProjectsAsync } from '@/lib/projects';
import { aboutService } from '@/lib/services/aboutService';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        const usedAssets = new Set<string>();

        // 1. Ambil semua project dari Firebase + Local JSON
        try {
            const projectsSnap = await db.ref('projects').once('value');
            const firebaseProjects = projectsSnap.val() || {};
            
            // Collect assets from Firebase projects
            Object.values(firebaseProjects).forEach((p: any) => {
                collectProjectAssets(p, usedAssets);
            });
        } catch (e) {
            console.log('Firebase not available, using local only');
        }

        // 2. Ambil dari Local JSON (Primary source)
        try {
            const localProjects = await allProjectsAsync();
            localProjects.forEach((p: any) => {
                collectProjectAssets(p, usedAssets);
            });
        } catch (e) {
            console.error('Failed to load local projects:', e);
        }

        // 3. Ambil dari About Data (untuk desktop icons, sticky notes, dll)
        try {
            const aboutData = await aboutService.getAboutData() as any;
            
            // Desktop icons
            if (aboutData.desktop?.icons) {
                aboutData.desktop.icons.forEach((icon: any) => {
                    if (icon.iconUrl) usedAssets.add(icon.iconUrl);
                });
            }
            
            // Sticky notes images
            if (aboutData.desktop?.stickyNotes) {
                aboutData.desktop.stickyNotes.forEach((note: any) => {
                    if (note.imageUrl) usedAssets.add(note.imageUrl);
                });
            }
        } catch (e) {
            console.error('Failed to load about data:', e);
        }

        // 4. Scan Folder Lokal (Dev environment)
        const projectAssetsDir = path.join(process.cwd(), 'public/assets/projects');
        let orphanFiles: string[] = [];
        let totalFiles = 0;

        if (fs.existsSync(projectAssetsDir)) {
            const files = fs.readdirSync(projectAssetsDir);
            totalFiles = files.length;

            files.forEach(file => {
                if (file === 'comparisons' || file === '.gitkeep') return; // Skip directory

                const publicPath = `/assets/projects/${file}`;

                // Periksa apakah path ini ada di set usedAssets (partial match)
                let isUsed = false;
                usedAssets.forEach(assetUrl => {
                    if (assetUrl.includes(publicPath) || assetUrl.includes(file)) isUsed = true;
                });

                if (!isUsed) {
                    orphanFiles.push(file);
                }
            });
        }

        return NextResponse.json({
            stats: {
                totalUsedAssetsDiscovered: usedAssets.size,
                totalFilesOnDisk: totalFiles,
                orphanFilesCount: orphanFiles.length
            },
            orphanFiles: orphanFiles
        });
    } catch (error) {
        console.error('Audit Error:', error);
        return NextResponse.json({ error: 'Audit Failed' }, { status: 500 });
    }
}

// Helper function to collect all assets from a project
function collectProjectAssets(p: any, usedAssets: Set<string>) {
    if (!p) return;
    
    if (p.cover) usedAssets.add(p.cover);
    if (p.comparison?.beforeImage) usedAssets.add(p.comparison.beforeImage);
    if (p.comparison?.afterImage) usedAssets.add(p.comparison.afterImage);
    if (p.gallery && Array.isArray(p.gallery)) {
        p.gallery.forEach((url: any) => {
            if (typeof url === 'string') usedAssets.add(url);
        });
    }
    if (p.galleryItems && Array.isArray(p.galleryItems)) {
        p.galleryItems.forEach((item: any) => {
            if (item.src) usedAssets.add(item.src);
        });
    }
    if (p.galleryGroups && Array.isArray(p.galleryGroups)) {
        p.galleryGroups.forEach((group: any) => {
            if (group.items && Array.isArray(group.items)) {
                group.items.forEach((item: any) => {
                    if (item.src) usedAssets.add(item.src);
                });
            }
        });
    }
}

export async function POST(req: NextRequest) {
    try {
        const isAdmin = await validateAdminRequest(req);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { files } = body;

        if (!files || !Array.isArray(files)) {
            return NextResponse.json({ error: 'Invalid files array' }, { status: 400 });
        }

        // Re-audit before delete to make sure we're not deleting used files
        const usedAssets = new Set<string>();
        
        // Collect from all sources again
        try {
            const localProjects = await allProjectsAsync();
            localProjects.forEach((p: any) => {
                collectProjectAssets(p, usedAssets);
            });
        } catch (e) {
            console.error('Failed to load local projects for safety check:', e);
        }

        try {
            const aboutData = await aboutService.getAboutData() as any;
            if (aboutData.desktop?.icons) {
                aboutData.desktop.icons.forEach((icon: any) => {
                    if (icon.iconUrl) usedAssets.add(icon.iconUrl);
                });
            }
            if (aboutData.desktop?.stickyNotes) {
                aboutData.desktop.stickyNotes.forEach((note: any) => {
                    if (note.imageUrl) usedAssets.add(note.imageUrl);
                });
            }
        } catch (e) {
            console.error('Failed to load about data for safety check:', e);
        }

        // Filter out files that are actually used
        const safeToDelete = files.filter((filename: string) => {
            let isUsed = false;
            usedAssets.forEach(assetUrl => {
                if (assetUrl.includes(filename)) isUsed = true;
            });
            if (isUsed) {
                console.warn(`[SAFETY] Prevented deletion of used file: ${filename}`);
            }
            return !isUsed;
        });

        if (safeToDelete.length === 0) {
            return NextResponse.json({
                message: 'No files deleted. All files are currently in use.',
                results: { success: 0, failed: 0, errors: [] }
            });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Batch delete from GitHub and Local
        for (const filename of safeToDelete) {
            const githubPath = `public/assets/projects/${filename}`;
            const localPath = path.join(process.cwd(), githubPath);

            // 1. Delete from GitHub
            try {
                await githubService.deleteFile(githubPath, `Cleanup: Removing orphan asset ${filename}`);
                results.success++;
            } catch (err: any) {
                console.error(`Failed to delete from GitHub ${githubPath}:`, err);
                // Even if GitHub fails (e.g. file already gone), we might want to continue to local
            }

            // 2. Delete from Local Disk (to sync UI)
            try {
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
            } catch (err: any) {
                console.error(`Failed to delete locally ${localPath}:`, err);
                results.failed++;
                results.errors.push(`${filename}: Local delete failed`);
            }
        }

        return NextResponse.json({
            message: `Cleanup completed: ${results.success} deleted, ${results.failed} failed. ${files.length - safeToDelete.length} files protected (in use).`,
            results
        });
    } catch (error: any) {
        console.error('Mass cleanup error:', error);
        return NextResponse.json({ error: error.message || 'Cleanup failed' }, { status: 500 });
    }
}
