import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/firebaseAdmin';
import { checkAdminAuth, validateAdminRequest } from '@/lib/auth';

const FOLDER_PATH = 'assets/icons-library';

export async function GET(req: NextRequest) {
    try {
        if (!checkAdminAuth(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [files] = await bucket.getFiles({ prefix: FOLDER_PATH });

        const icons = files
            .filter(file => {
                const name = file.name;
                if (name.includes('/.')) return false;
                if (name.includes('_temp')) return false;
                return /\.(webp|png|jpg|jpeg|svg)$/i.test(name);
            })
            .sort((a, b) => b.name.localeCompare(a.name))
            .map(file => {
                // Return Firebase Storage Public URL format
                return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
            });

        return NextResponse.json({ icons });
    } catch (error) {
        console.error('[IconsAPI] GET Error:', error);
        return NextResponse.json({ error: 'Failed to list icons' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        if (!await validateAdminRequest(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const iconUrl = searchParams.get('url');

        if (!iconUrl) {
            return NextResponse.json({ error: 'No icon URL provided' }, { status: 400 });
        }

        // 1. Resolve Path from URL
        let storagePath = '';
        if (iconUrl.includes('/o/')) {
            const parts = iconUrl.split('/o/');
            const pathWithParams = parts[1].split('?')[0];
            storagePath = decodeURIComponent(pathWithParams);
        } else if (iconUrl.startsWith('/assets/')) {
            storagePath = iconUrl.startsWith('/') ? iconUrl.substring(1) : iconUrl;
        }

        if (!storagePath || !storagePath.includes(FOLDER_PATH)) {
            return NextResponse.json({ error: 'Invalid icon path' }, { status: 400 });
        }

        const dirName = storagePath.split('/').slice(0, -1).join('/'); // assets/icons-library
        const fileName = storagePath.split('/').pop() || '';
        const ext = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
        const baseName = ext ? fileName.substring(0, fileName.length - ext.length) : fileName;

        // Variants to delete
        const extensions = ['.icns', '.webp', '.png', '.jpg', '.jpeg', '.svg'];
        const suffixes = ['', '_temp'];

        // Collect all potential targets
        const targetsToDelete: string[] = [];
        for (const suffix of suffixes) {
            for (const variantExt of extensions) {
                targetsToDelete.push(`${dirName}/${baseName}${suffix}${variantExt}`);
            }
        }

        // Delete from Firebase Storage
        await Promise.all(targetsToDelete.map(async (targetPath) => {
            try {
                const file = bucket.file(targetPath);
                const [exists] = await file.exists();
                if (exists) {
                    await file.delete();
                    console.log(`[IconsAPI] Deleted: ${targetPath}`);
                }
            } catch (err) {
                console.warn(`[IconsAPI] Failed to delete ${targetPath}:`, err);
            }
        }));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[IconsAPI] DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete icon' }, { status: 500 });
    }
}
