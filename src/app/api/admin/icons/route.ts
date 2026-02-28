import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkAdminAuth } from '@/lib/auth';
import { githubService } from '@/lib/github';

// Helper for Windows EBUSY/EPERM
// Helper for Windows EBUSY/EPERM
const safeUnlink = async (p: string) => {
    if (!fs.existsSync(p)) return;
    let attempts = 0;
    while (attempts < 10) {
        try {
            // Try async unlink first
            await fs.promises.unlink(p);
            return;
        } catch (err: unknown) {
            const nodeErr = err as { code?: string };
            if (['EBUSY', 'EPERM', 'EACCES'].includes(nodeErr.code || '')) {
                attempts++;
                await new Promise(r => setTimeout(r, 250 * attempts));
            } else {
                if (nodeErr.code === 'ENOENT') return; // File already gone
                throw err;
            }
        }
    }
    // If we get here, we failed to delete
    throw new Error(`Failed to delete ${p} after multiple attempts (EBUSY/EPERM).`);
};

export async function GET(req: NextRequest) {
    try {
        if (!await checkAdminAuth(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isDev = process.env.NODE_ENV === 'development';
        const folderPath = 'assets/icons-library';
        const publicFolderPath = path.join(process.cwd(), 'public', folderPath);

        let icons: string[] = [];

        if (isDev) {
            // Local mode
            if (!fs.existsSync(publicFolderPath)) {
                fs.mkdirSync(publicFolderPath, { recursive: true });
            }
            const files = fs.readdirSync(publicFolderPath);
            icons = files
                .filter(file => {
                    // Filter junk and temp files
                    if (file.startsWith('.')) return false;
                    if (file.includes('_temp')) return false;
                    return /\.(webp|png|jpg|jpeg|svg)$/i.test(file);
                })
                .sort((a, b) => b.localeCompare(a)) // Newest (higher timestamp) first
                .map(file => `/${folderPath}/${file}`);
        } else {
            // Production: Query GitHub API via existing fetch patterns
            const owner = process.env.GITHUB_OWNER;
            const repo = process.env.GITHUB_REPO;
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/public/${folderPath}`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN}`
                },
                next: { revalidate: 0 } // No cache for production scan either to ensure visibility
            });

            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    icons = data
                        .filter(file => {
                            if (file.type !== 'file') return false;
                            if (file.name.startsWith('.')) return false;
                            if (file.name.includes('_temp')) return false;
                            return /\.(webp|png|jpg|jpeg|svg)$/i.test(file.name);
                        })
                        .sort((a, b) => b.name.localeCompare(a.name)) // Descending order
                        .map(file => {
                            // Construct raw URL for preview with cache buster
                            return `https://raw.githubusercontent.com/${owner}/${repo}/main/public/${folderPath}/${file.name}?v=${Date.now()}`;
                        });
                }
            } else if (response.status === 404) {
                icons = [];
            } else {
                throw new Error(`GitHub API returned ${response.status}`);
            }
        }

        return NextResponse.json({ icons });
    } catch (error) {
        console.error('[IconsAPI] Error:', error);
        return NextResponse.json({ error: 'Failed to list icons' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        if (!await checkAdminAuth(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        let iconUrl = searchParams.get('url');

        if (!iconUrl) {
            return NextResponse.json({ error: 'No icon URL provided' }, { status: 400 });
        }

        // Strip query parameters (cache busters)
        iconUrl = iconUrl.split('?')[0];

        // 1. Resolve Path
        let relativePath = '';
        if (iconUrl.startsWith('https://raw.githubusercontent.com')) {
            const parts = iconUrl.split('/public/');
            if (parts.length > 1) {
                relativePath = `public/${parts[1]}`;
            }
        } else if (iconUrl.startsWith('/assets/')) {
            relativePath = `public${iconUrl}`;
        }

        if (!relativePath || !relativePath.includes('assets/icons-library')) {
            return NextResponse.json({ error: 'Invalid icon path' }, { status: 400 });
        }

        const isDev = process.env.NODE_ENV === 'development';
        const absolutePath = path.join(process.cwd(), relativePath);
        const dir = path.dirname(absolutePath);
        const filename = path.basename(absolutePath);
        const ext = path.extname(filename);
        const baseName = filename.substring(0, filename.length - ext.length); // e.g. "123-file"

        // Smart Delete: Target all variants (original, webp, temp)
        const variants = ['.icns', '.webp', '.png', '.jpg', '.jpeg', '.svg'];
        const suffixes = ['', '_temp'];

        const folderRelPath = path.dirname(relativePath).replace(/\\/g, '/');

        // OPTIMIZATION: Fetch existing files first to avoid unnecessary sequential checks
        let existingFiles: string[] = [];
        if (isDev) {
            const publicDir = path.join(process.cwd(), folderRelPath);
            if (fs.existsSync(publicDir)) {
                existingFiles = fs.readdirSync(publicDir);
            }
        } else {
            const owner = process.env.GITHUB_OWNER;
            const repo = process.env.GITHUB_REPO;
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${folderRelPath}`;
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `Bearer ${process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    existingFiles = data.map(f => f.name);
                }
            }
        }

        // Collect all potential targets that actually exist
        const targetsToDelete: string[] = [];
        for (const suffix of suffixes) {
            for (const variantExt of variants) {
                const targetName = `${baseName}${suffix}${variantExt}`;
                if (existingFiles.includes(targetName)) {
                    targetsToDelete.push(targetName);
                }
            }
        }

        // 2. Execute Deletions (Parallelized to save time on Vercel)
        await Promise.all(targetsToDelete.map(async (targetName) => {
            const targetRelPath = `${folderRelPath}/${targetName}`;
            const targetAbsPath = path.join(dir, targetName);

            // Local Delete
            if (isDev && fs.existsSync(targetAbsPath)) {
                try {
                    await safeUnlink(targetAbsPath);
                } catch (err: unknown) {
                    const errMsg = err instanceof Error ? err.message : String(err);
                    console.error(`[IconsAPI] Local delete failure for ${targetName}:`, errMsg);
                }
            }

            // GitHub Delete
            const hasGitHubToken = !!(process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN);
            if (hasGitHubToken) {
                try {
                    // githubService.deleteFile handles fetching current SHA internally
                    await githubService.deleteFile(targetRelPath, `Delete icon variant ${targetName}`);
                } catch (error: unknown) {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    console.warn(`[IconsAPI] GitHub delete failure for ${targetName}:`, errMsg);
                }
            }
        }));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[IconsAPI] DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete icon' }, { status: 500 });
    }
}
