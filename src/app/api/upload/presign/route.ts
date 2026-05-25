import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import {
  createR2PresignedPutUrl,
  getMissingR2EnvKeys,
  isR2StorageConfigured,
} from '@/lib/r2Storage';

export const runtime = 'nodejs';

/**
 * Issues a short-lived presigned PUT URL so the admin browser can upload
 * large videos (typically wallpapers > 4.5 MB) directly to Cloudflare R2.
 *
 * Why bypass /api/upload?
 *   /api/upload reads the request as FormData via `req.formData()`. Vercel
 *   caps Route Handler request bodies at the platform body size limit
 *   (4.5 MB on Hobby), so any FormData larger than that fails to parse and
 *   surfaces as "Failed to parse body as FormData" in the toast. Wallpaper
 *   videos at 1920x1080 routinely cross that threshold even after client
 *   compression, so we sidestep the function entirely for the upload bytes
 *   and keep the function only for the small JSON metadata exchange.
 *
 * Security:
 *   - Admin-only (validateAdminRequest + CSRF via the existing proxy).
 *   - Client cannot pick the storage key — server derives it from a
 *     restricted set of folders ("wallpapers" only, for now).
 *   - Content-Type is bound into the signature, so the browser PUT must
 *     match exactly. R2 rejects mismatches.
 *   - Signed URL is valid for 10 minutes only.
 */

const ALLOWED_FOLDERS = new Set(['wallpapers']);
const ALLOWED_EXTENSIONS = new Set(['mp4', 'webm', 'mov']);
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB hard ceiling.

interface PresignRequestBody {
  folder?: string;
  filename?: string;
  contentType?: string;
  size?: number;
}

function sanitizeBaseName(input: string): string {
  return (
    input
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'wallpaper'
  );
}

export async function POST(req: NextRequest) {
  try {
    if (!(await validateAdminRequest(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isR2StorageConfigured()) {
      return NextResponse.json(
        {
          error: `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`,
        },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as PresignRequestBody | null;
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const folder = body.folder ?? '';
    const filename = body.filename ?? '';
    const contentType = body.contentType ?? '';
    const size = Number(body.size ?? 0);

    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json(
        {
          error: `Folder "${folder}" tidak diizinkan untuk direct upload`,
        },
        { status: 400 }
      );
    }

    if (!contentType.startsWith('video/')) {
      return NextResponse.json(
        {
          error: 'Direct upload hanya untuk video',
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(size) || size <= 0 || size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Ukuran video tidak valid (max ${MAX_VIDEO_SIZE_BYTES / 1024 / 1024} MB)`,
        },
        { status: 400 }
      );
    }

    const sourceExt = (filename.split('.').pop() || 'mp4').toLowerCase();
    const ext = ALLOWED_EXTENSIONS.has(sourceExt) ? sourceExt : 'mp4';
    const base = sanitizeBaseName(filename || 'wallpaper');
    const key = `assets/wallpapers/${Date.now()}-${base}.${ext}`;

    const presigned = await createR2PresignedPutUrl({
      key,
      contentType,
    });

    return NextResponse.json({
      success: true,
      uploadUrl: presigned.uploadUrl,
      publicUrl: presigned.publicUrl,
      key: presigned.key,
      contentType,
      cacheControl: presigned.cacheControl,
      expiresInSeconds: presigned.expiresInSeconds,
    });
  } catch (e) {
    console.error('Presign error:', e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Failed to issue presigned URL',
      },
      { status: 500 }
    );
  }
}
