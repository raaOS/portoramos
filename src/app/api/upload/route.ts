import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
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

        // Sanitize filename
        const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
        const filename = `${Date.now()}-${cleanName}`;
        const uploadDir = path.join(process.cwd(), 'public/assets/media');

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);

        await fs.promises.writeFile(filePath, buffer);

        return NextResponse.json({
            url: `/assets/media/${filename}`,
            success: true
        });
    } catch (e: any) {
        console.error('Upload Error:', e);
        return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
    }
}
