import { NextRequest, NextResponse } from 'next/server';
import { db, bucket } from '@/lib/firebaseAdmin';
import { validateAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        if (!(await validateAdminRequest(req, { checkCsrf: false }))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orphanFiles = await getOrphanFiles();
        const [files] = await bucket.getFiles({ prefix: 'assets/' });

        return NextResponse.json({
            orphanFiles,
            orphanCount: orphanFiles.length,
            totalFiles: files.length
        });
    } catch (error) {
        console.error('Simple Audit Error:', error);
        return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        if (!await validateAdminRequest(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { files } = body;

        if (!Array.isArray(files) || files.length === 0) {
            return NextResponse.json({ error: 'No files specified' }, { status: 400 });
        }

        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const filename of files) {
            try {
                const file = bucket.file(filename);
                const [exists] = await file.exists();
                if (exists) {
                    await file.delete();
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push(`${filename}: Not found`);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`Failed to delete ${filename}:`, err);
                results.errors.push(`${filename}: ${message}`);
                results.failed++;
            }
        }

        return NextResponse.json({
            message: `Deleted ${results.success} files, ${results.failed} failed`,
            results
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Audit failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function getOrphanFiles(): Promise<string[]> {
    const usedAssets = new Set<string>();

    // From projects
    const projectsSnap = await db.ref('projects').once('value');
    const projects = projectsSnap.val() || {};
    Object.values(projects as Record<string, { cover?: string; comparison?: { beforeImage?: string; afterImage?: string }; galleryItems?: { src?: string }[] }>).forEach((p) => {
        if (p.cover) usedAssets.add(p.cover);
        if (p.comparison?.beforeImage) usedAssets.add(p.comparison.beforeImage);
        if (p.comparison?.afterImage) usedAssets.add(p.comparison.afterImage);
        if (p.galleryItems) {
            (p.galleryItems as { src?: string }[]).forEach((item) => {
                if (item.src) usedAssets.add(item.src);
            });
        }
    });

    // From Content
    const contentSnap = await db.ref('content').once('value');
    const content = contentSnap.val() || {};
    if (content.about?.desktop?.icons) {
        (content.about.desktop.icons as { iconUrl?: string }[]).forEach((icon) => {
            if (icon.iconUrl) usedAssets.add(icon.iconUrl);
        });
    }

    const [files] = await bucket.getFiles({ prefix: 'assets/' });
    const orphanFiles: string[] = [];

    files.forEach(file => {
        const name = file.name;
        if (name.includes('/.')) return;

        const encodedName = encodeURIComponent(name);
        let isUsed = false;
        usedAssets.forEach(url => {
            if (url.includes(encodedName) || url.endsWith(name)) {
                isUsed = true;
            }
        });

        if (!isUsed) {
            orphanFiles.push(name);
        }
    });

    return orphanFiles;
}
