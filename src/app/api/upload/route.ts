import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { bucket } from '@/lib/firebaseAdmin';
import { optimizeVideoForPortfolio } from '@/lib/videoOptimization';

export const runtime = 'nodejs';
export const maxDuration = 60;

// FIXED (BUG-010): Valid filename characters
const VALID_FILENAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const MAX_FILENAME_LENGTH = 100;

function sanitizeFilename(input: string | null): string | null {
    if (!input) return null;

    // Remove any path traversal attempts
    const sanitized = input
        .replace(/[/\\]/g, '') // Remove path separators
        .replace(/\.{2,}/g, '') // Remove sequences of dots
        .replace(/[<>"|?*]/g, ''); // Remove other dangerous chars

    // Validate result
    if (!VALID_FILENAME_REGEX.test(sanitized)) {
        return null;
    }

    // Limit length
    return sanitized.substring(0, MAX_FILENAME_LENGTH);
}

export async function POST(req: NextRequest) {
    try {
        if (!await validateAdminRequest(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Basic Validation
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        const originalBuffer = Buffer.from(await file.arrayBuffer());
        let buffer: Buffer<ArrayBufferLike> = originalBuffer;
        let contentType = file.type;

        const { searchParams } = new URL(req.url);
        const rawCustomFilename = searchParams.get('filename');
        const folderParam = searchParams.get('folder');
        const skipMainVideoOptimization = searchParams.get('skipMainVideoOptimization') === '1';
        const isVideoUpload = file.type.startsWith('video/');

        // FIXED (BUG-010): Sanitize custom filename
        const customFilename = sanitizeFilename(rawCustomFilename);
        if (rawCustomFilename && !customFilename) {
            return NextResponse.json({
                error: 'Invalid filename. Use only alphanumeric characters, hyphens, and underscores.'
            }, { status: 400 });
        }

        // Determine Name & Folder
        const sourceExt = file.name.split('.').pop() || '';
        const ext = isVideoUpload ? 'mp4' : sourceExt;
        let finalFilename: string;
        let targetDir: string;

        if (customFilename) {
            finalFilename = `${customFilename}.${ext}`;
            targetDir = 'assets/projects';
        } else if (folderParam === 'comparisons') {
            const rawSlug = searchParams.get('slug');
            const cleanSlug = rawSlug ? sanitizeFilename(rawSlug) : null;
            const cleanName = cleanSlug ? `${cleanSlug}-before` : file.name.split('.')[0];
            finalFilename = `${cleanName}.${ext}`;
            targetDir = 'assets/projects/comparisons';
        } else {
            const cleanName = isVideoUpload
                ? file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '-')
                : file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
            finalFilename = isVideoUpload ? `${Date.now()}-${cleanName}.mp4` : `${Date.now()}-${cleanName}`;
            
            // Respect the folder param if provided and safe
            if (folderParam && (folderParam.startsWith('assets/') || folderParam === 'temp')) {
                targetDir = folderParam;
            } else {
                targetDir = 'assets/media';
            }
        }

        const storagePath = `${targetDir}/${finalFilename}`;
        let previewPath: string | null = null;
        let posterPath: string | null = null;
        let videoStats: {
            originalSize: number;
            optimizedSize: number;
            previewSize: number;
            posterSize: number;
        } | null = null;

        if (isVideoUpload) {
            const optimized = await optimizeVideoForPortfolio(originalBuffer, {
                allowOriginalPassthrough: file.type === 'video/mp4',
            });
            buffer = skipMainVideoOptimization ? originalBuffer : optimized.buffer;
            contentType = 'video/mp4';
            videoStats = {
                originalSize: optimized.originalSize,
                optimizedSize: buffer.length,
                previewSize: optimized.previewSize,
                posterSize: optimized.posterSize,
            };

            const basePath = storagePath.replace(/\.(mp4|webm|mov)$/i, '');
            previewPath = `${basePath}-preview.mp4`;
            posterPath = `${basePath}.jpg`;

            await bucket.file(previewPath).save(optimized.previewBuffer, {
                metadata: {
                    contentType: 'video/mp4',
                    cacheControl: 'public, max-age=31536000, immutable',
                }
            });

            await bucket.file(posterPath).save(optimized.posterBuffer, {
                metadata: {
                    contentType: 'image/jpeg',
                    cacheControl: 'public, max-age=31536000, immutable',
                }
            });
        }

        const firebaseFile = bucket.file(storagePath);

        await firebaseFile.save(buffer, {
            metadata: {
                contentType,
                cacheControl: 'public, max-age=31536000, immutable',
            }
        });

        const publicUrl = buildFirebaseMediaUrl(storagePath);

        return NextResponse.json({
            url: publicUrl,
            previewUrl: previewPath ? buildFirebaseMediaUrl(previewPath) : undefined,
            posterUrl: posterPath ? buildFirebaseMediaUrl(posterPath) : undefined,
            videoStats,
            success: true
        });
    } catch (e) {
        console.error('Upload Error:', e);
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 });
    }
}

function buildFirebaseMediaUrl(storagePath: string): string {
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
}

export async function DELETE(req: NextRequest) {
    try {
        if (!await validateAdminRequest(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const storagePath = searchParams.get('path');

        if (!storagePath) {
            return NextResponse.json({ error: 'Missing storage path' }, { status: 400 });
        }

        // Only allow deleting from certain paths for security
        if (!storagePath.startsWith('assets/') && !storagePath.startsWith('temp/')) {
            return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
        }

        const firebaseFile = bucket.file(storagePath);
        const [exists] = await firebaseFile.exists();

        if (exists) {
            await firebaseFile.delete();
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Delete Error:', e);
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Delete failed' }, { status: 500 });
    }
}
