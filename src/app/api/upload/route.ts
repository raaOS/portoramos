import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { checkAdminAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    if (!checkAdminAuth(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
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

        // [STICKY NOTE] LOCAL FILE STORAGE
        // File yang diupload akan disimpan di dalam folder "public/assets/media".
        // Kenapa public? Agar bisa langsung diakses browser via URL (contoh: domain.com/assets/media/gambar.jpg).
        // Filename dibersihkan (sanitize) agar tidak ada karakter aneh yang bikin error.
        const { searchParams } = new URL(req.url);
        const customFilename = searchParams.get('filename');
        const folderParam = searchParams.get('folder');

        // Determine Name & Folder
        const ext = file.name.split('.').pop() || '';
        let finalFilename: string;
        let targetDir: string;

        if (customFilename) {
            // Smart Upload: Direct to projects folder with correct name
            finalFilename = `${customFilename}.${ext}`;
            targetDir = 'assets/projects';
        } else {
            // Standard
            const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
            finalFilename = `${Date.now()}-${cleanName}`;
            targetDir = folderParam === 'temp' ? 'temp' : 'assets/media';
        }

        const uploadDir = path.join(process.cwd(), 'public', targetDir);

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, finalFilename);

        await fs.promises.writeFile(filePath, buffer);

        return NextResponse.json({
            url: `/${targetDir}/${finalFilename}`,
            success: true
        });
    } catch (e: any) {
        console.error('Upload Error:', e);
        return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
    }
}
