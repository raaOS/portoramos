import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import path from 'path';

/**
 * GitHub Direct Upload API
 * Uploads files directly to GitHub Repository via API.
 * Used for Mobile/Vercel environments where local filesystem is ephemeral.
 */

// Config
const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_OWNER;
const REPO_NAME = process.env.GITHUB_REPO;
const BRANCH = 'main'; // Adjust if using 'master'



export async function POST(req: NextRequest) {
    if (!(await validateAdminRequest(req))) {
        return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }
    if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
        return NextResponse.json({ error: 'GitHub Configuration Missing (Token/Owner/Repo)' }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 1. Prepare File Data
        const buffer = Buffer.from(await file.arrayBuffer());
        const contentBase64 = buffer.toString('base64');

        const { searchParams } = new URL(req.url);
        const customFilename = searchParams.get('filename');
        const folderParam = searchParams.get('folder');

        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        let uploadFolder: string;
        let warning: string | undefined;

        if (folderParam) {
            // Respect folder param if provided, ensuring public prefix
            uploadFolder = folderParam.startsWith('public') ? folderParam : `public/${folderParam}`;
        } else {
            // Default folder
            uploadFolder = 'public/assets/projects';
        }

        let finalFilename: string;
        if (customFilename) {
            finalFilename = `${customFilename}.${ext}`;
        } else {
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
            // Add random suffix to prevent collisions during parallel uploads (409 errors)
            const randomId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
            finalFilename = `${Date.now()}-${randomId}-${cleanName}`;
            console.log(`[UploadAPI] Generated unique filename: ${finalFilename}`);
        }

        let processedBuffer: Buffer = buffer;
        let processedPath = `${uploadFolder}/${finalFilename}`;

        // ICNS -> WebP Pre-optimization (Essential for Vercel/Production support)
        if (ext === 'icns') {
            console.log(`[UploadAPI] ICNS detected, running pre-commit optimization...`);
            try {
                if (buffer.toString('utf8', 0, 4) === 'icns') {
                    // Supported PNG/JPEG2000 types
                    const iconTypes = [
                        'ic10', 'ic09', 'ic08', 'ic14', 'ic13', 'ic07', // PNG/Retina
                        'icp6', 'icp5', 'icp4', // Smaller blocks
                        'TOC ' // Table of contents (skip)
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

                        if (iconTypes.includes(type) && type !== 'TOC ') {
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

                    // Sort by size descending
                    candidates.sort((a, b) => b.size - a.size);

                    const [sharpMod, { spawn }, { default: ffmpegPath }] = await Promise.all([
                        import('sharp'),
                        import('child_process'),
                        import('ffmpeg-static')
                    ]);
                    const sharp = sharpMod.default;

                    // Helper: Decode JP2 via FFmpeg pipe (since Sharp often lacks JP2 support)
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
                        console.log(`[UploadAPI] Trying icon block: ${candidate.type} (${candidate.size} bytes)`);
                        try {
                            let inputBuffer = candidate.buffer;

                            // Check for JP2 signature: 00 00 00 0C 6A 50
                            const isJP2 = inputBuffer[0] === 0x00 && inputBuffer[4] === 0x6A;

                            if (isJP2) {
                                try {
                                    console.log(`[UploadAPI] Detected JP2 block, using FFmpeg to decode...`);
                                    inputBuffer = await decodeJp2WithFfmpeg(inputBuffer);
                                    console.log(`[UploadAPI] FFmpeg decoded JP2 -> PNG (${inputBuffer.length} bytes)`);
                                } catch (ffmpegErr) {
                                    console.warn(`[UploadAPI] FFmpeg JP2 decode failed, trying Sharp directly...`, ffmpegErr);
                                    inputBuffer = candidate.buffer;
                                }
                            }

                            processedBuffer = await sharp(candidate.buffer)
                                .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
                                .webp({ quality: 85 })
                                .toBuffer();

                            // Success! Update path to .webp
                            processedPath = processedPath.replace('.icns', '.webp');
                            finalFilename = finalFilename.replace('.icns', '.webp');
                            console.log(`[UploadAPI] Success with block ${candidate.type}! Converted to WebP.`);
                            converted = true;
                            break;
                        } catch (conversionErr) {
                            console.warn(`[UploadAPI] Failed to convert block ${candidate.type}:`, conversionErr);
                        }
                    }

                    if (!converted) {
                        console.warn(`[UploadAPI] ICNS format unsupported (JP2/Legacy). Rejecting.`);
                        return NextResponse.json(
                            { error: 'Format ICNS Legacy (JP2) tidak didukung. Mohon convert ke PNG manual.' },
                            { status: 422 }
                        );
                    }
                }
            } catch (err) {
                console.warn(`[UploadAPI] ICNS pre-optimization failed, continuing with original:`, err);
            }
        }

        // Audio Conversion: Any audio -> WAV (Essential for OS Sound compatibility)
        const isAudioFile = file.type.startsWith('audio/') || ['mp3', 'm4a', 'ogg', 'aac', 'flac', 'webm'].includes(ext);
        if (isAudioFile && ext !== 'wav' && uploadFolder.includes('sounds')) {
            console.log(`[UploadAPI] Audio detected (${ext}) in sounds folder, converting to WAV...`);
            try {
                const [{ default: ffmpegPath }, { spawn }] = await Promise.all([
                    import('ffmpeg-static'),
                    import('child_process')
                ]);

                const convertAudio = async (inBuffer: Buffer): Promise<Buffer> => {
                    return new Promise((resolve, reject) => {
                        const ffmpeg = spawn(ffmpegPath as string, [
                            '-i', 'pipe:0',
                            '-f', 'wav',
                            '-acodec', 'pcm_s16le', // Standard 16-bit PCM WAV
                            '-ar', '44100',        // 44.1kHz sample rate
                            '-ac', '2',            // Stereo
                            'pipe:1'
                        ]);
                        const chunks: Buffer[] = [];
                        ffmpeg.stdout.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
                        ffmpeg.stderr.on('data', () => { }); // Silence stderr logs

                        ffmpeg.on('close', (code: number) => {
                            if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks));
                            else reject(new Error(`FFmpeg audio conversion failed with code ${code}`));
                        });
                        ffmpeg.on('error', (err: any) => reject(err));
                        ffmpeg.stdin.write(inBuffer);
                        ffmpeg.stdin.end();
                    });
                };

                const convertedBuffer = await convertAudio(buffer);
                processedBuffer = convertedBuffer;

                // Update final path and filename to .wav
                const oldExtRegex = new RegExp(`\\.${ext}$`, 'i');
                processedPath = processedPath.replace(oldExtRegex, '.wav');
                finalFilename = finalFilename.replace(oldExtRegex, '.wav');
                console.log(`[UploadAPI] Audio conversion success! Saved as: ${finalFilename}`);
            } catch (err) {
                console.warn(`[UploadAPI] Audio conversion failed, keeping original:`, err);
            }
        }

        const path = processedPath;
        const finalContentBase64 = processedBuffer.toString('base64');

        // 1.5 Local Save in Development
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
            const fs = require('fs');
            const nodePath = require('path');
            const absolutePath = nodePath.join(process.cwd(), path);
            const dir = nodePath.dirname(absolutePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(absolutePath, processedBuffer);
            console.log(`[UploadAPI] Dev: Saved locally to ${absolutePath}`);
        }

        // 2. Upload to GitHub
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;

        // Get existing file SHA if it exists (required for overwrites)
        let existingSha: string | undefined;
        try {
            const getRes = await fetch(url, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'User-Agent': 'Portfolio-Uploader'
                }
            });
            if (getRes.ok) {
                const existingData = await getRes.json();
                existingSha = existingData.sha;
                console.log(`[UploadAPI] Found existing file, SHA: ${existingSha}`);
            }
        } catch (e) {
            console.warn(`[UploadAPI] Error checking for existing SHA:`, e);
        }

        const uploadFileWithRetry = async (retryCount = 0): Promise<Response> => {
            const body: { message: string; content: string; branch: string; sha?: string } = {
                message: `Upload ${finalFilename} via Admin Panel`,
                content: finalContentBase64,
                branch: BRANCH
            };

            if (existingSha) {
                body.sha = existingSha;
            }

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Portfolio-Uploader'
                },
                body: JSON.stringify(body)
            });

            if (response.status === 409 && retryCount < 3) {
                console.warn(`[UploadAPI] 409 Conflict. Retrying ${retryCount + 1}/3...`);
                // Wait slightly longer each time
                await new Promise(r => setTimeout(r, 500 * (retryCount + 1)));
                return uploadFileWithRetry(retryCount + 1);
            }
            return response;
        };

        const response = await uploadFileWithRetry();

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub Upload Failed: ${errorText}`);
        }

        const data = await response.json();

        // 3. Construct Public URL
        // We use the Raw URL for immediate availability (avoiding CDN cache delay)
        // Format: /assets/media/filename (Logic: Next.js Image wrapper should handle this if we use local path logic, 
        // BUT for Vercel deployment we might need absolute URL if the file isn't in the build yet)

        // PROBLEM: If we return "/assets/media/...", Next.js will look in its CURRENT build folder. The file IS NOT THERE yet.
        // It's only on GitHub. Vercel needs to rebuild to fetch it.
        // SOLUTION: Return the Absolute GitHub Raw URL.
        const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${path}`;

        // ALTERNATIVE: jsDelivr (Better for caching, but maybe slight delay)
        // const cdnUrl = `https://cdn.jsdelivr.net/gh/${REPO_OWNER}/${REPO_NAME}@${BRANCH}/${path}`;

        // Let's stick to a format that our app handles.
        // Since our app expects "/assets/media/...", using an absolute URL might break some internal logic 
        // if we have components strictly expecting relative paths.
        // BUT `next/image` handles absolute URLs fine if hostname is allowed.

        return NextResponse.json({
            url: rawUrl,
            publicPath: path.replace(/^public/, ''), // Strip 'public' prefix to make it a valid Next.js asset path
            githubPath: data.content.path,
            warning
        });

    } catch (error: any) {
        console.error('GitHub Upload Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
