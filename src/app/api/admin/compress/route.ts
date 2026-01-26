import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { checkAdminAuth } from '@/lib/auth';
import { githubService } from '@/lib/github';



export async function POST(request: NextRequest) {
    try {
        if (!checkAdminAuth(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filePath } = await request.json();

        if (!filePath) {
            return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
        }

        const cleanPath = filePath.split('?')[0];

        if (!cleanPath.startsWith('/assets/') && !cleanPath.startsWith('assets/')) {
            return NextResponse.json({ error: 'Only local assets can be compressed' }, { status: 400 });
        }

        let relativePath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
        const isDev = process.env.NODE_ENV === 'development';

        let absolutePath = path.join(process.cwd(), 'public', relativePath);
        let workPath = absolutePath;
        let originalSize = 0;

        if (!isDev) {
            if (fs.existsSync(absolutePath)) {
                const tmpInput = path.join('/tmp', path.basename(absolutePath));
                fs.copyFileSync(absolutePath, tmpInput);
                workPath = tmpInput;
                originalSize = fs.statSync(workPath).size;
            } else {
                console.log(`[CompressAPI] File not found locally in Prod, fetching from GitHub: ${relativePath}`);
                try {
                    const owner = process.env.GITHUB_OWNER;
                    const repo = process.env.GITHUB_REPO;
                    const token = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
                    const branch = 'main';

                    if (!owner || !repo || !token) {
                        throw new Error('GitHub configuration missing for production fetch');
                    }

                    const repoPath = relativePath.startsWith('public/') ? relativePath : `public/${relativePath}`;
                    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}?ref=${branch}`;

                    const ghResponse = await fetch(url, {
                        headers: {
                            'Authorization': `token ${token}`,
                            'Accept': 'application/vnd.github.v3.raw',
                            'User-Agent': 'Portfolio-Compressor'
                        }
                    });

                    if (!ghResponse.ok) {
                        throw new Error(`GitHub fetch failed: ${ghResponse.status} ${ghResponse.statusText}`);
                    }

                    const arrayBuffer = await ghResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const tmpInput = path.join('/tmp', path.basename(absolutePath));

                    fs.writeFileSync(tmpInput, buffer);
                    workPath = tmpInput;
                    originalSize = buffer.length;
                    console.log(`[CompressAPI] Successfully fetched from GitHub (${originalSize} bytes)`);
                } catch (err) {
                    console.error('[CompressAPI] GitHub Fetch Fallback Error:', err);
                    return NextResponse.json({
                        error: 'File not found locally and GitHub fallback failed',
                        details: err instanceof Error ? err.message : String(err)
                    }, { status: 404 });
                }
            }
        } else {
            if (!fs.existsSync(absolutePath)) {
                return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
            }
            originalSize = fs.statSync(absolutePath).size;
        }

        const originalSizeMB = originalSize / (1024 * 1024);
        console.log(`[CompressAPI] Processing: ${relativePath} (${originalSizeMB.toFixed(2)} MB)`);

        const ext = path.extname(absolutePath).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.icns'].includes(ext);
        const isVideo = ['.mp4', '.mov', '.webm', '.mkv'].includes(ext);

        let tempPath = '';

        const safeUnlink = async (p: string) => {
            if (!fs.existsSync(p)) return;
            let attempts = 0;
            while (attempts < 10) {
                try {
                    await fs.promises.unlink(p);
                    return;
                } catch (err: any) {
                    if (['EBUSY', 'EPERM', 'EACCES'].includes(err.code)) {
                        attempts++;
                        await new Promise(r => setTimeout(r, 250 * attempts));
                    } else {
                        if (err.code === 'ENOENT') return;
                        throw err;
                    }
                }
            }
            try { fs.unlinkSync(p); } catch (e) { console.warn('Final unlink failed:', e); }
        };

        const safeRename = async (src: string, dest: string) => {
            if (src === dest) return;
            await new Promise(r => setTimeout(r, 200));
            try {
                if (fs.existsSync(dest)) await safeUnlink(dest);
                await fs.promises.rename(src, dest);
            } catch (err: any) {
                console.warn(`[CompressAPI] Rename failed (${err.code}), attempting Copy+Unlink fallback...`);
                let attempts = 0;
                while (attempts < 5) {
                    try {
                        await fs.promises.copyFile(src, dest);
                        if (fs.existsSync(dest)) {
                            await safeUnlink(src);
                            return;
                        }
                    } catch (copyErr: any) {
                        const code = copyErr.code || 'UNKNOWN';
                        console.warn(`[CompressAPI] Copy attempt ${attempts + 1} failed: ${code}`);
                        attempts++;
                        await new Promise(r => setTimeout(r, 500 * attempts));
                    }
                }
                throw new Error(`Failed to move file from ${src} to ${dest} after retries.`);
            }
        };

        const safeCopy = async (src: string, dest: string) => {
            let attempts = 0;
            while (attempts < 10) {
                try {
                    fs.copyFileSync(src, dest);
                    return;
                } catch (err: any) {
                    if (err.code === 'EBUSY') {
                        attempts++;
                        await new Promise(r => setTimeout(r, 200 * attempts));
                    } else throw err;
                }
            }
        };

        let compressionSuccess = false;

        if (isImage) {
            tempPath = isDev
                ? absolutePath.replace(ext, '_temp.webp')
                : path.join('/tmp', 'compressed_' + path.basename(absolutePath, ext) + '.webp');

            try {
                if (ext === '.icns') {
                    console.log(`[CompressAPI] ICNS detected, parsing structure...`);
                    const buffer = fs.readFileSync(workPath);
                    if (buffer.toString('utf8', 0, 4) !== 'icns') {
                        throw new Error('Invalid ICNS header');
                    }

                    const iconTypes = ['ic10', 'ic09', 'ic08', 'ic14', 'ic13', 'ic07', 'icp6', 'icp5', 'icp4'];
                    interface IconCandidate { type: string; size: number; buffer: Buffer; }
                    const candidates: IconCandidate[] = [];

                    let pos = 8;
                    while (pos < buffer.length) {
                        const type = buffer.toString('utf8', pos, pos + 4);
                        const size = buffer.readUInt32BE(pos + 4);
                        if (iconTypes.includes(type)) {
                            const blockData = buffer.slice(pos + 8, pos + size);
                            const isPng = blockData[0] === 0x89 && blockData[1] === 0x50;
                            const isJP2 = blockData[0] === 0x00 && blockData[4] === 0x6A;
                            if (isPng || isJP2) {
                                candidates.push({ type, size, buffer: blockData });
                            }
                        }
                        pos += size;
                        if (size <= 0) break;
                    }
                    candidates.sort((a, b) => b.size - a.size);

                    const sharp = require('sharp');

                    let converted = false;
                    for (const candidate of candidates) {
                        try {
                            await sharp(candidate.buffer)
                                .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                                .webp({ quality: 85, effort: 4 })
                                .toFile(tempPath);

                            console.log(`[CompressAPI] Success with block ${candidate.type}!`);
                            converted = true;
                            break;
                        } catch (conversionErr) {
                            console.warn(`[CompressAPI] Failed to convert block ${candidate.type}:`, conversionErr);
                        }
                    }

                    if (converted) {
                        compressionSuccess = true;
                    } else {
                        throw new Error(`Could not find a valid/supported PNG or JPEG2000 block.`);
                    }
                } else {
                    const sharp = require('sharp');
                    await sharp(workPath)
                        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
                        .webp({ quality: 80, effort: 4 })
                        .toFile(tempPath);
                    compressionSuccess = true;
                }
            } catch (err) {
                console.error(`[CompressAPI] Compression failed for ${ext}:`, err);
                await safeCopy(workPath, tempPath);
                compressionSuccess = false;
            }

        } else if (isVideo) {
            return NextResponse.json({ error: 'Video compression should be done client-side.' }, { status: 400 });
        } else {
            return NextResponse.json({ error: 'Unsupported file type for compression' }, { status: 400 });
        }

        const newSize = fs.statSync(tempPath).size;
        const newSizeMB = newSize / (1024 * 1024);

        if (isDev) {
            if (isImage && ext !== '.webp' && compressionSuccess) {
                const oldPath = absolutePath;
                const newAbsolutePath = absolutePath.replace(ext, '.webp');

                await safeUnlink(oldPath);
                await safeRename(tempPath, newAbsolutePath);

                const hasGitHubToken = !!(process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN);
                if (hasGitHubToken) {
                    const oldRepoPath = `public/${relativePath.replace('public/', '')}`;
                    try {
                        await githubService.deleteFile(oldRepoPath, `Delete original ${ext} after WebP conversion`);
                    } catch (e) {
                        console.warn('[CompressAPI] Failed to delete original file from GitHub:', e);
                    }
                }

                relativePath = relativePath.replace(ext, '.webp');
                absolutePath = newAbsolutePath;
            } else {
                await safeRename(tempPath, absolutePath);
            }

            const hasGitHubToken = !!(process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN);
            if (hasGitHubToken && compressionSuccess) {
                try {
                    console.log(`[CompressAPI] Dev: Auto-syncing conversion to GitHub...`);
                    const fileBuffer = fs.readFileSync(absolutePath);
                    const targetRepoPath = `public/${relativePath.replace('public/', '')}`;
                    await githubService.updateFile(targetRepoPath, fileBuffer, `Sync converted/optimized ${path.basename(relativePath)}`);
                } catch (err) {
                    console.warn(`[CompressAPI] Dev: GitHub sync failed:`, err);
                }
            } else if (!compressionSuccess && hasGitHubToken) {
                console.log(`[CompressAPI] Dev: Skipping GitHub sync because compression failed.`);
            }
            console.log(`[CompressAPI] Local Update Success: ${originalSizeMB.toFixed(2)} MB -> ${newSizeMB.toFixed(2)} MB`);
        } else {
            if (compressionSuccess) {
                console.log(`[CompressAPI] Syncing to GitHub...`);
                const fileBuffer = fs.readFileSync(tempPath);
                let targetRepoPath = `public/${relativePath.replace('public/', '')}`;
                if (isImage && ext !== '.webp') {
                    targetRepoPath = targetRepoPath.replace(ext, '.webp');
                }
                await githubService.updateFile(targetRepoPath, fileBuffer, `Compress ${path.basename(relativePath)} (via Admin CMS)`);
                console.log(`[CompressAPI] GitHub Sync Success`);

                if (isImage && ext !== '.webp') {
                    const oldRepoPath = `public/${relativePath.replace('public/', '')}`;
                    try {
                        await githubService.deleteFile(oldRepoPath, `Delete original ${path.basename(relativePath)} after WebP conversion`);
                    } catch (e) {
                        console.warn('[CompressAPI] Failed to delete original source from GitHub:', e);
                    }
                }
            } else {
                console.log(`[CompressAPI] Skipping GitHub sync because compression failed.`);
            }
            await safeUnlink(tempPath);
            if (workPath.startsWith('/tmp')) await safeUnlink(workPath);
        }

        return NextResponse.json({
            success: true,
            originalSize: originalSizeMB.toFixed(2) + ' MB',
            newSize: newSizeMB.toFixed(2) + ' MB',
            saved: ((1 - newSize / originalSize) * 100).toFixed(0) + '%',
            note: isDev ? 'Saved locally' : 'Synced to GitHub (Redeploying...)',
            newPath: relativePath.startsWith('/') ? relativePath : '/' + relativePath
        });
    } catch (error) {
        console.error('[CompressAPI] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
