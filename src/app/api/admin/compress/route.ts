import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { checkAdminAuth } from '@/lib/auth';
import { githubService } from '@/lib/github';

// RATE LIMITING untuk compress API
const compressAttempts = new Map<string, { count: number; resetTime: number }>();
const COMPRESS_RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 menit
const MAX_COMPRESS_ATTEMPTS = 5; // Maksimal 5 kompresi per 10 menit



function getClientIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (request as any).ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}-${userAgent}`.slice(0, 200); // Batasi panjang
}

function checkCompressRateLimit(identifier: string): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const attemptData = compressAttempts.get(identifier);

    if (!attemptData) {
        compressAttempts.set(identifier, { count: 1, resetTime: now + COMPRESS_RATE_LIMIT_WINDOW });
        return { allowed: true };
    }

    if (now > attemptData.resetTime) {
        // Reset window baru
        compressAttempts.set(identifier, { count: 1, resetTime: now + COMPRESS_RATE_LIMIT_WINDOW });
        return { allowed: true };
    }

    if (attemptData.count >= MAX_COMPRESS_ATTEMPTS) {
        return { allowed: false, resetTime: attemptData.resetTime };
    }

    // Tambah counter
    attemptData.count++;
    return { allowed: true };
}

export async function POST(request: NextRequest) {
    try {
        if (!checkAdminAuth(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // RATE LIMITING
        const clientId = getClientIdentifier(request);
        const rateLimit = checkCompressRateLimit(clientId);

        if (!rateLimit.allowed) {
            const resetDate = new Date(rateLimit.resetTime!);
            return NextResponse.json({
                error: 'Too many compression requests',
                message: `Rate limit exceeded. Try again after ${resetDate.toLocaleTimeString()}`,
                retryAfter: Math.ceil((rateLimit.resetTime! - Date.now()) / 1000)
            }, {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((rateLimit.resetTime! - Date.now()) / 1000))
                }
            });
        }

        const { filePath } = await request.json();

        if (!filePath) {
            return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
        }

        // VALIDASI AMAN - cegah path traversal attack
        if (filePath.includes('..') || filePath.includes('~') || filePath.includes('//')) {
            return NextResponse.json({ error: 'Invalid file path - path traversal detected' }, { status: 400 });
        }

        // Normalisasi path - hanya izinkan assets folder
        const normalizedPath = path.normalize(filePath).replace(/^[\/\\]+/, '');

        if (!normalizedPath.startsWith('assets/')) {
            return NextResponse.json({ error: 'Only assets folder files can be compressed' }, { status: 400 });
        }

        // Validasi ekstensi file yang diizinkan
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.icns', '.mp4', '.mov', '.webm', '.mkv'];
        const inputExt = path.extname(normalizedPath).toLowerCase();
        if (!allowedExtensions.includes(inputExt)) {
            return NextResponse.json({ error: 'File type not supported for compression' }, { status: 400 });
        }

        const cleanPath = '/' + normalizedPath;

        let relativePath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
        const isDev = process.env.NODE_ENV === 'development';

        // VALIDASI UKURAN FILE MAKSIMAL (50MB) - cegah DoS
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

        let absolutePath = path.join(process.cwd(), 'public', relativePath);
        let workPath = absolutePath;
        let originalSize = 0;

        if (!isDev) {
            if (fs.existsSync(absolutePath)) {
                const fileStats = fs.statSync(absolutePath);
                if (fileStats.size > MAX_FILE_SIZE) {
                    return NextResponse.json({ error: 'File too large - maximum 50MB allowed' }, { status: 400 });
                }
                originalSize = fileStats.size;
                const tmpInput = path.join('/tmp', path.basename(absolutePath));
                fs.copyFileSync(absolutePath, tmpInput);
                workPath = tmpInput;
            } else {
                // Fetch from GitHub in production
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

                    // Validasi ukuran file dari GitHub
                    if (buffer.length > MAX_FILE_SIZE) {
                        return NextResponse.json({ error: 'File too large from GitHub - maximum 50MB allowed' }, { status: 400 });
                    }

                    const tmpInput = path.join('/tmp', path.basename(absolutePath));
                    fs.writeFileSync(tmpInput, buffer);
                    workPath = tmpInput;
                    originalSize = buffer.length;
                    // Successfully fetched from GitHub
                } catch (err) {
                    // GitHub fetch fallback failed
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
            const fileStats = fs.statSync(absolutePath);
            if (fileStats.size > MAX_FILE_SIZE) {
                return NextResponse.json({ error: 'File too large - maximum 50MB allowed' }, { status: 400 });
            }
            originalSize = fileStats.size;
        }

        const originalSizeMB = originalSize / (1024 * 1024);
        // Processing file compression

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
            try { fs.unlinkSync(p); } catch (e) { /* Silently handle unlink failures */ }
        };

        const safeRename = async (src: string, dest: string) => {
            if (src === dest) return;

            // Validasi path sebelum operasi
            if (!src || !dest || src.includes('..') || dest.includes('..')) {
                throw new Error('Invalid path for rename operation');
            }

            await new Promise(r => setTimeout(r, 200));
            try {
                if (fs.existsSync(dest)) await safeUnlink(dest);
                await fs.promises.rename(src, dest);
            } catch (err: any) {
                // Rename failed, attempting Copy+Unlink fallback
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
                        // Silently handle copy failures
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
                    // ICNS detected, parsing structure
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

                            // Success with block conversion
                            converted = true;
                            break;
                        } catch (conversionErr) {
                            // Failed to convert block - silently continue
                        }
                    }

                    if (converted) {
                        compressionSuccess = true;
                    } else {
                        throw new Error(`Could not find a valid/supported PNG or JPEG2000 block.`);
                    }
                } else {
                    try {
                        const sharp = require('sharp');
                        await sharp(workPath)
                            .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
                            .webp({ quality: 80, effort: 4 })
                            .toFile(tempPath);
                        compressionSuccess = true;
                    } catch (sharpError) {
                        // Sharp compression failed
                        throw new Error(`Image compression failed: ${sharpError instanceof Error ? sharpError.message : 'Unknown error'}`);
                    }
                }
            } catch (err) {
                // Compression failed for file type
                // Hanya fallback copy untuk error non-kritis, bukan untuk error validasi
                if (err instanceof Error && err.message.includes('compression failed')) {
                    throw err; // Lempar kembali error kompresi yang spesifik
                }
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
                        // Silently handle GitHub file deletion errors
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
                    // Auto-syncing conversion to GitHub
                    const fileBuffer = fs.readFileSync(absolutePath);
                    const targetRepoPath = `public/${relativePath.replace('public/', '')}`;
                    await githubService.updateFile(targetRepoPath, fileBuffer, `Sync converted/optimized ${path.basename(relativePath)}`);
                } catch (err) {
                    // Silently handle GitHub sync failures
                }
            } else if (!compressionSuccess && hasGitHubToken) {
                // Skipping GitHub sync because compression failed
            }
            // Local compression successful
        } else {
            if (compressionSuccess) {
                // Syncing to GitHub
                const fileBuffer = fs.readFileSync(tempPath);
                let targetRepoPath = `public/${relativePath.replace('public/', '')}`;
                if (isImage && ext !== '.webp') {
                    targetRepoPath = targetRepoPath.replace(ext, '.webp');
                }
                await githubService.updateFile(targetRepoPath, fileBuffer, `Compress ${path.basename(relativePath)} (via Admin CMS)`);
                // GitHub sync successful

                if (isImage && ext !== '.webp') {
                    const oldRepoPath = `public/${relativePath.replace('public/', '')}`;
                    try {
                        await githubService.deleteFile(oldRepoPath, `Delete original ${path.basename(relativePath)} after WebP conversion`);
                    } catch (e) {
                        // Silently handle GitHub deletion errors
                    }
                }
            } else {
                // Skipping GitHub sync because compression failed
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
        // Silently handle compression errors
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
