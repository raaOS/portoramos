import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { bucket } from '@/lib/firebaseAdmin';

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

        const buffer = Buffer.from(await file.arrayBuffer());

        const { searchParams } = new URL(req.url);
        const rawCustomFilename = searchParams.get('filename');
        const folderParam = searchParams.get('folder');

        // FIXED (BUG-010): Sanitize custom filename
        const customFilename = sanitizeFilename(rawCustomFilename);
        if (rawCustomFilename && !customFilename) {
            return NextResponse.json({ 
                error: 'Invalid filename. Use only alphanumeric characters, hyphens, and underscores.' 
            }, { status: 400 });
        }

        // Determine Name & Folder
        const ext = file.name.split('.').pop() || '';
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
            const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
            finalFilename = `${Date.now()}-${cleanName}`;
            targetDir = folderParam === 'temp' ? 'temp' : 'assets/media';
        }

        const storagePath = `${targetDir}/${finalFilename}`;
        const firebaseFile = bucket.file(storagePath);

        await firebaseFile.save(buffer, {
            metadata: { contentType: file.type }
        });

        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;

        return NextResponse.json({
            url: publicUrl,
            success: true
        });
    } catch (e) {
        console.error('Upload Error:', e);
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 });
    }
}
