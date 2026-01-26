import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { checkAdminAuth } from '@/lib/auth';
import { githubService } from '@/lib/github';

// We need to use require for these specific packages to avoid build issues with Next.js edge/serverless handling
// even though we are running in Node.js runtime.
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('ffmpeg-static');

// Configure ffmpeg
let ffmpegPath = ffmpegInstaller;
if (typeof ffmpegPath === 'string' && (ffmpegPath.startsWith('\\ROOT') || !path.isAbsolute(ffmpegPath))) {
    const cleanPath = ffmpegPath.replace('\\ROOT', '');
    ffmpegPath = path.join(process.cwd(), cleanPath);
}
ffmpeg.setFfmpegPath(ffmpegPath);
console.log(`[CompressAPI] FFmpeg Path: ${ffmpegPath}`);

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check
        if (!checkAdminAuth(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { filePath } = await request.json();

        if (!filePath) {
            return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
        }

        // 3. Resolve Path
        const cleanPath = filePath.split('?')[0];

        // Ensure it's a local asset
        if (!cleanPath.startsWith('/assets/') && !cleanPath.startsWith('assets/')) {
            return NextResponse.json({ error: 'Only local assets can be compressed' }, { status: 400 });
        }

        let relativePath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
        const isDev = process.env.NODE_ENV === 'development';

        let absolutePath = path.join(process.cwd(), 'public', relativePath);
        let workPath = absolutePath;
        let originalSize = 0;

        // PRODUCTION (Vercel):
        // We cannot rely on 'public' being writable.
        // We cannot even rely on 'public' containing the file if it wasn't part of build or if it's large.
        // However, usually Vercel includes public folder for reading.
        if (!isDev) {
            if (fs.existsSync(absolutePath)) {
                const tmpInput = path.join('/tmp', path.basename(absolutePath));
                fs.copyFileSync(absolutePath, tmpInput);
                workPath = tmpInput;
                originalSize = fs.statSync(workPath).size;
            } else {
                // PRODUCTION (Vercel): File might not be local yet if just uploaded to GitHub.
                // Pull it from GitHub into /tmp.
                console.log(`[CompressAPI] File not found locally in Prod, fetching from GitHub: ${relativePath}`);
                try {
                    const owner = process.env.GITHUB_OWNER;
                    const repo = process.env.GITHUB_REPO;
                    const token = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
                    const branch = 'main';

                    if (!owner || !repo || !token) {
                        throw new Error('GitHub configuration missing for production fetch');
                    }

                    // Standardize repo path (must start with public/ if it's an asset)
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

        // 4. Compress
        // In Prod, write output to /tmp

        const ext = path.extname(absolutePath).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.icns'].includes(ext);
        const isVideo = ['.mp4', '.mov', '.webm', '.mkv'].includes(ext);

        let tempPath = '';

        // HELPER: Robust File Operations for Windows EBUSY/EPERM
        const safeUnlink = async (p: string) => {
            if (!fs.existsSync(p)) return;
            let attempts = 0;
            while (attempts < 10) {
                try {
                    // Try async unlink first
                    await fs.promises.unlink(p);
                    return;
                } catch (err: any) {
                    if (['EBUSY', 'EPERM', 'EACCES'].includes(err.code)) {
                        attempts++;
                        await new Promise(r => setTimeout(r, 250 * attempts));
                    } else {
                        // Try forcing sync unlink as last resort? No, better throw or ignore if ENOENT
                        if (err.code === 'ENOENT') return;
                        throw err;
                    }
                }
            }
            // Final attempt with sync
            try { fs.unlinkSync(p); } catch (e) { console.warn('Final unlink failed:', e); }
        };

        const safeRename = async (src: string, dest: string) => {
            if (src === dest) return;

            // Small delay to ensure previous handles (sharp/ffmpeg) are released
            await new Promise(r => setTimeout(r, 200));

            try {
                // Remove dest if exists
                if (fs.existsSync(dest)) await safeUnlink(dest);

                // Try standard rename
                await fs.promises.rename(src, dest);
            } catch (err: any) {
                console.warn(`[CompressAPI] Rename failed (${err.code}), attempting Copy+Unlink fallback...`);

                // Fallback: Copy and Delete with retries
                let attempts = 0;
                while (attempts < 5) {
                    try {
                        await fs.promises.copyFile(src, dest);
                        // Verify copy success?
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
            // IMAGE COMPRESSION (Sharp)
            tempPath = isDev
                ? absolutePath.replace(ext, '_temp.webp') // Force webp
                : path.join('/tmp', 'compressed_' + path.basename(absolutePath, ext) + '.webp');

            try {
                if (ext === '.icns') {
                    // ICNS conversion: Manual extraction of embedded PNG/JP2
                    console.log(`[CompressAPI] ICNS detected, parsing structure...`);

                    const buffer = fs.readFileSync(workPath);
                    if (buffer.toString('utf8', 0, 4) !== 'icns') {
                        throw new Error('Invalid ICNS header');
                    }

                    // Supported PNG/JPEG2000 types
                    const iconTypes = [
                        'ic10', 'ic09', 'ic08', 'ic14', 'ic13', 'ic07', // PNG/Retina
                        'icp6', 'icp5', 'icp4' // Smaller blocks
                    ];

                    interface IconCandidate {
                        type: string;
                        size: number;
                        buffer: Buffer;
                    }
                    const candidates: IconCandidate[] = [];

                    let pos = 8;
                    while (pos < buffer.length) {
                        const type = buffer.toString('utf8', pos, pos + 4);
                        const size = buffer.readUInt32BE(pos + 4);

                        if (iconTypes.includes(type)) {
                            const blockData = buffer.slice(pos + 8, pos + size);
                            // Check for PNG header [89 50 4E 47] or JPEG 2000 [00 00 00 0C 6A 50 20 20]
                            const isPng = blockData[0] === 0x89 && blockData[1] === 0x50;
                            const isJP2 = blockData[0] === 0x00 && blockData[4] === 0x6A;

                            if (isPng || isJP2) {
                                candidates.push({ type, size, buffer: blockData });
                            }
                        }
                        pos += size;
                        if (size <= 0) break;
                    }

                    // Sort by size descending (prefer higher res)
                    candidates.sort((a, b) => b.size - a.size);

                    const sharp = require('sharp');
                    const { spawn } = require('child_process');
                    const ffmpegPath = require('ffmpeg-static');

                    // Helper: Decode JP2 via FFmpeg pipe
                    const decodeJp2WithFfmpeg = async (inBuffer: Buffer): Promise<Buffer> => {
                        return new Promise((resolve, reject) => {
                            const ffmpeg = spawn(ffmpegPath as string, [
                                '-f', 'image2pipe', '-i', 'pipe:0', // Read from stdin
                                '-f', 'image2pipe', '-c:v', 'png',   // Convert to PNG stream
                                'pipe:1' // Write to stdout
                            ]);

                            const chunks: Buffer[] = [];
                            ffmpeg.stdout.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
                            ffmpeg.stderr.on('data', () => { }); // Mute stderr

                            ffmpeg.on('close', (code: number) => {
                                if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks));
                                else reject(new Error(`FFmpeg exited with code ${code}`));
                            });

                            ffmpeg.on('error', (err: any) => reject(err));

                            ffmpeg.stdin.write(inBuffer);
                            ffmpeg.stdin.end();
                        });
                    };

                    let converted = false;

                    for (const candidate of candidates) {
                        console.log(`[CompressAPI] Trying icon block: ${candidate.type} (${candidate.size} bytes)`);
                        try {
                            let inputBuffer = candidate.buffer;
                            const isJP2 = inputBuffer[0] === 0x00 && inputBuffer[4] === 0x6A;

                            if (isJP2) {
                                try {
                                    console.log(`[CompressAPI] Detected JP2 block, using FFmpeg to decode...`);
                                    inputBuffer = await decodeJp2WithFfmpeg(inputBuffer);
                                    console.log(`[CompressAPI] FFmpeg decoded JP2 -> PNG (${inputBuffer.length} bytes)`);
                                } catch (ffmpegErr) {
                                    console.warn(`[CompressAPI] FFmpeg JP2 decode failed, trying Sharp directly...`, ffmpegErr);
                                    inputBuffer = candidate.buffer;
                                }
                            }

                            await sharp(inputBuffer)
                                .resize(512, 512, {
                                    fit: 'inside',
                                    withoutEnlargement: true
                                })
                                .webp({ quality: 85, effort: 4 })
                                .toFile(tempPath);

                            console.log(`[CompressAPI] Success with block ${candidate.type}!`);
                            converted = true;
                            break; // Stop after first success
                        } catch (conversionErr) {
                            console.warn(`[CompressAPI] Failed to convert block ${candidate.type}:`, conversionErr);
                            // Continue to next candidate
                        }
                    }

                    if (converted) {
                        compressionSuccess = true;
                    } else {
                        throw new Error(`Could not find a valid/supported PNG or JPEG2000 block inside the ICNS file (Checked ${candidates.length} candidates).`);
                    }
                } else {
                    const sharp = require('sharp');
                    await sharp(workPath)
                        .resize(1920, 1920, {
                            fit: 'inside',
                            withoutEnlargement: true
                        })
                        .webp({ quality: 80, effort: 4 })
                        .toFile(tempPath);
                    compressionSuccess = true;
                }
            } catch (err) {
                console.error(`[CompressAPI] Compression failed for ${ext}:`, err);
                // Fallback: Copy original if compression fails
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

        // 5. Commit Changes
        if (isDev) {
            // Only replace extension if compression was successful!
            if (isImage && ext !== '.webp' && compressionSuccess) {
                // If we changed extension, delete the old file and move the new one
                const oldPath = absolutePath;
                const newAbsolutePath = absolutePath.replace(ext, '.webp');

                await safeUnlink(oldPath);
                await safeRename(tempPath, newAbsolutePath);

                relativePath = relativePath.replace(ext, '.webp'); // Update ref
                absolutePath = newAbsolutePath; // For GitHub sync below
            } else {
                // Keep original name/extension
                await safeRename(tempPath, absolutePath);
            }

            // Sync to GitHub even in Dev if token is present (to keep remote in sync)
            const hasGitHubToken = !!(process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN);

            // Only sync if compression SUCCEEDED. 
            // If failed, we just have the original file which is likely already on GitHub from UploadAPI.
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
                console.log(`[CompressAPI] Dev: Skipping GitHub sync because compression failed (Original file preserved).`);
            }

            console.log(`[CompressAPI] Local Update Success: ${originalSizeMB.toFixed(2)} MB -> ${newSizeMB.toFixed(2)} MB`);
        } else {
            // Production: Commit to GitHub
            // Only sync if compression SUCCEEDED.
            if (compressionSuccess) {
                console.log(`[CompressAPI] Syncing to GitHub...`);
                const fileBuffer = fs.readFileSync(tempPath);

                // Handle extension change for images
                let targetRepoPath = `public/${relativePath.replace('public/', '')}`;
                if (isImage && ext !== '.webp') {
                    targetRepoPath = targetRepoPath.replace(ext, '.webp');
                }

                await githubService.updateFile(targetRepoPath, fileBuffer, `Compress ${path.basename(relativePath)} (via Admin CMS)`);
                console.log(`[CompressAPI] GitHub Sync Success`);
            } else {
                console.log(`[CompressAPI] Skipping GitHub sync because compression failed (Original file preserved).`);
            }

            // Cleanup tmp
            await safeUnlink(tempPath);
            if (workPath.startsWith('/tmp')) await safeUnlink(workPath);
        }

        return NextResponse.json({
            success: true,
            originalSize: originalSizeMB.toFixed(2) + ' MB',
            newSize: newSizeMB.toFixed(2) + ' MB',
            saved: ((1 - newSize / originalSize) * 100).toFixed(0) + '%',
            note: isDev ? 'Saved locally' : 'Synced to GitHub (Redeploying...)',
            newPath: relativePath.startsWith('/') ? relativePath : '/' + relativePath // Return new path in case of ext change
        });
    } catch (error) {
        console.error('[CompressAPI] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
