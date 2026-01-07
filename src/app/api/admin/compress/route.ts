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

        const relativePath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
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
        const tempPath = isDev
            ? absolutePath.replace(path.extname(absolutePath), '_temp' + path.extname(absolutePath))
            : path.join('/tmp', 'compressed_' + path.basename(absolutePath));

        await new Promise((resolve, reject) => {
            ffmpeg(workPath)
                // Resize to 720p (Balanced)
                .outputOptions('-vf', 'scale=720:-2')
                // Ensure yuv420p for web compatibility
                .outputOptions('-pix_fmt', 'yuv420p')
                // Codec
                .videoCodec('libx264')
                // CRF 28 (Balanced)
                .outputOptions('-crf', '28')
                // Mid preset for serverless execution time limits (veryslow might timeout 10s func)
                .outputOptions('-preset', 'mid')
                // No Audio (for covers)
                .noAudio()
                // Faststart for web
                .outputOptions('-movflags', '+faststart')
                .on('end', resolve)
                .on('error', reject)
                .save(tempPath);
        });

        const newSize = fs.statSync(tempPath).size;
        const newSizeMB = newSize / (1024 * 1024);

        // 5. Commit Changes
        if (isDev) {
            // Local: Overwrite original directly
            fs.unlinkSync(absolutePath);
            fs.renameSync(tempPath, absolutePath);
            console.log(`[CompressAPI] Local Update Success: ${originalSizeMB.toFixed(2)} MB -> ${newSizeMB.toFixed(2)} MB`);
        } else {
            // Production: Commit to GitHub
            console.log(`[CompressAPI] Syncing to GitHub...`);
            const fileBuffer = fs.readFileSync(tempPath);

            // This path should match the repo structure. 'public/assets/...' is likely mapped to 'public/assets/...' in repo
            const repoPath = `public/${relativePath.replace('public/', '')}`; // Ensure clean path

            await githubService.updateFile(repoPath, fileBuffer, `Compress video ${path.basename(relativePath)} (via Admin CMS)`);

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
            note: isDev ? 'Saved locally' : 'Synced to GitHub (Redeploying...)'
        });

    } catch (error) {
        console.error('[CompressAPI] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
