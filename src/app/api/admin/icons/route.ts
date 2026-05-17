import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { deleteIconSchema } from '@/lib/validations';
import { validationError } from '@/lib/api-response';
import { buildR2PublicUrl, deleteFromR2, isR2StorageConfigured, listR2ObjectKeys } from '@/lib/r2Storage';
import { extractStoragePath } from '@/lib/urlResolver';

const FOLDER_PATH = 'assets/icons-library';

export async function GET(req: NextRequest) {
    try {
        if (!(await validateAdminRequest(req, { checkCsrf: false }))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isR2StorageConfigured()) {
            return NextResponse.json({ icons: [] });
        }

        const icons = (await listR2ObjectKeys({ prefix: FOLDER_PATH }))
            .filter(isIconKey)
            .sort((a, b) => b.localeCompare(a))
            .map((key) => buildR2PublicUrl(key));

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

        const validation = deleteIconSchema.safeParse({ url: iconUrl });
        if (!validation.success) {
            return validationError(validation.error);
        }

        const { url } = validation.data;

        const storagePath = extractStoragePath(url);
        if (!storagePath) {
            return NextResponse.json({ error: 'Invalid icon path/URL structure' }, { status: 400 });
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

        await Promise.all(targetsToDelete.map(async (targetPath) => {
            try {
                await deleteR2IconIfConfigured(targetPath);
                console.log(`[IconsAPI] Delete requested: ${targetPath}`);
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

function isIconKey(key: string) {
    if (key.includes('/.')) return false;
    if (key.includes('_temp')) return false;
    return /\.(webp|png|jpg|jpeg|svg)$/i.test(key);
}

async function deleteR2IconIfConfigured(targetPath: string) {
    if (!isR2StorageConfigured()) return;
    await deleteFromR2(targetPath);
}
