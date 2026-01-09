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
ffmpeg.setFfmpegPath(ffmpegInstaller);

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
                return NextResponse.json({ error: 'File not found on server (Production)' }, { status: 404 });
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
        const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif'].includes(ext);
        const isVideo = ['.mp4', '.mov', '.webm', '.mkv'].includes(ext);

        let tempPath = '';

        if (isImage) {
            // IMAGE COMPRESSION (Sharp)
            tempPath = isDev
                ? absolutePath.replace(ext, '_temp.webp') // Force webp
                : path.join('/tmp', 'compressed_' + path.basename(absolutePath, ext) + '.webp');

            const sharp = require('sharp');
            await sharp(workPath)
                .resize(1920, 1920, {
                    fit: 'inside', // Resize to max 1920x1920, maintaining aspect ratio. Never upscales.
                    withoutEnlargement: true
                })
                .webp({ quality: 80, effort: 4 }) // WebP High Quality
                .toFile(tempPath);

        } else if (isVideo) {
            // VIDEO COMPRESSION: Removed from server-side.
            // Client-side ffmpeg used instead to save bandwidth/resources.
            return NextResponse.json({ error: 'Video compression should be done client-side.' }, { status: 400 });
        } else {
            return NextResponse.json({ error: 'Unsupported file type for compression' }, { status: 400 });
        }

        const newSize = fs.statSync(tempPath).size;
        const newSizeMB = newSize / (1024 * 1024);

        // 5. Commit Changes
        if (isDev) {
            // Local: Overwrite original
            // Note: If image converted to webp, we might need to update the extension if we want to replaceStrict?
            // Current login in AdminFileUpload expects the SAME url. 
            // If we change ext, the URL changes.
            // For now, let's keep it simple: Overwrite functionality is tricky if extension changes.
            // But for WebP, we really want to change extension.

            // Hack for now: If image, we prefer keeping original ext if we can? No, WebP is much better.
            // Let's assume for now we might replace the file.

            // WAIT: If we change extension, the 'relativePath' sent by client is invalid.
            // We should return the NEW relative path.

            if (isImage && ext !== '.webp') {
                // If we changed extension, delete the old file and move the new one
                fs.unlinkSync(absolutePath);
                const newAbsolutePath = absolutePath.replace(ext, '.webp');
                fs.renameSync(tempPath, newAbsolutePath);
                relativePath = relativePath.replace(ext, '.webp'); // Update ref
            } else {
                fs.unlinkSync(absolutePath);
                fs.renameSync(tempPath, absolutePath);
            }

            console.log(`[CompressAPI] Local Update Success: ${originalSizeMB.toFixed(2)} MB -> ${newSizeMB.toFixed(2)} MB`);
        } else {
            // Production: Commit to GitHub
            console.log(`[CompressAPI] Syncing to GitHub...`);
            const fileBuffer = fs.readFileSync(tempPath);

            // Handle extension change for images
            let targetRepoPath = `public/${relativePath.replace('public/', '')}`;
            if (isImage && ext !== '.webp') {
                targetRepoPath = targetRepoPath.replace(ext, '.webp');
                // We should theoretically DELETE the old file on GitHub too, but having both is safe for now (or simpler logic).
                // Ideally updateFile handles this? No.
            }

            await githubService.updateFile(targetRepoPath, fileBuffer, `Compress ${path.basename(relativePath)} (via Admin CMS)`);

            // Cleanup tmp
            fs.unlinkSync(tempPath);
            if (workPath.startsWith('/tmp')) fs.unlinkSync(workPath);

            console.log(`[CompressAPI] GitHub Sync Success`);
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
