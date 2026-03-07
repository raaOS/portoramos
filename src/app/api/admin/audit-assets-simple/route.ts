import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { githubService } from '@/lib/github';
import { allProjectsAsync } from '@/lib/projects';
import { aboutService } from '@/lib/services/aboutService';
import fs from 'fs';
import path from 'path';

// Simplified audit: Local JSON is the source of truth
export async function GET(request: NextRequest) {
    try {
        // 1. Get all used assets from Local JSON (Master)
        const usedAssets = new Set<string>();

        // From projects
        const projects = await allProjectsAsync();
        projects.forEach(p => {
            if (p.cover) usedAssets.add(getFilename(p.cover));
            if (p.comparison?.beforeImage) usedAssets.add(getFilename(p.comparison.beforeImage));
            if (p.comparison?.afterImage) usedAssets.add(getFilename(p.comparison.afterImage));
            if (p.galleryItems) {
                p.galleryItems.forEach((item: any) => {
                    if (item.src) usedAssets.add(getFilename(item.src));
                });
            }
            if (p.galleryGroups) {
                p.galleryGroups.forEach((group: any) => {
                    group.items?.forEach((item: any) => {
                        if (item.src) usedAssets.add(getFilename(item.src));
                    });
                });
            }
        });

        // From desktop icons
        const aboutData = await aboutService.getAboutData() as any;
        if (aboutData.desktop?.icons) {
            aboutData.desktop.icons.forEach((icon: any) => {
                if (icon.iconUrl) usedAssets.add(getFilename(icon.iconUrl));
            });
        }

        // From hero background
        if (aboutData.hero?.backgroundTrail) {
            aboutData.hero.backgroundTrail.forEach((bg: any) => {
                if (bg.src) usedAssets.add(getFilename(bg.src));
            });
        }

        // 2. Scan local folder
        const assetsDir = path.join(process.cwd(), 'public/assets/projects');
        const orphanFiles: string[] = [];

        if (fs.existsSync(assetsDir)) {
            const files = fs.readdirSync(assetsDir);
            
            files.forEach(file => {
                // Skip directories and non-media files
                if (fs.statSync(path.join(assetsDir, file)).isDirectory()) return;
                if (!file.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i)) return;

                // If not in used assets, it's orphan
                if (!usedAssets.has(file.toLowerCase())) {
                    orphanFiles.push(file);
                }
            });
        }

        return NextResponse.json({
            orphanFiles,
            usedCount: usedAssets.size,
            totalFiles: fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).length : 0
        });

    } catch (error) {
        console.error('Simple Audit Error:', error);
        return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
    }
}

// DELETE orphan files
export async function POST(request: NextRequest) {
    try {
        const isAdmin = await validateAdminRequest(request);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { files } = body;

        if (!Array.isArray(files) || files.length === 0) {
            return NextResponse.json({ error: 'No files specified' }, { status: 400 });
        }

        // Re-verify files are still orphans
        const verifyRes = await fetch(`http://localhost:${process.env.PORT || 3000}/api/admin/audit-assets-simple`);
        const { orphanFiles: currentOrphans } = await verifyRes.json();

        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const filename of files) {
            // Safety check: only delete if still orphan
            if (!currentOrphans.includes(filename)) {
                results.errors.push(`${filename}: File sekarang digunakan (tidak dihapus)`);
                results.failed++;
                continue;
            }

            const githubPath = `public/assets/projects/${filename}`;
            const localPath = path.join(process.cwd(), 'public/assets/projects', filename);

            try {
                // Delete from GitHub
                await githubService.deleteFile(githubPath, `Cleanup: Removing unused asset ${filename}`);
                
                // Delete from local
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
                
                results.success++;
            } catch (err: any) {
                console.error(`Failed to delete ${filename}:`, err);
                results.errors.push(`${filename}: ${err.message}`);
                results.failed++;
            }
        }

        return NextResponse.json({
            message: `Deleted ${results.success} files, ${results.failed} failed`,
            results
        });

    } catch (error: any) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function getFilename(url: string): string {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1].toLowerCase();
}
