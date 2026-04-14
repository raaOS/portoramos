import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { validateAdminRequest } from '@/lib/auth';
import { bucket } from '@/lib/firebaseAdmin';
import { compressFileSchema } from '@/lib/validations';
import { validationError } from '@/lib/api-response';
import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';
import { getClientIP } from '@/lib/security/request';

const COMPRESS_RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_COMPRESS_ATTEMPTS = 10;
const COMPRESS_RATE_LIMIT_BLOCK = 30 * 60 * 1000; // 30 minutes block after limit

export async function POST(request: NextRequest) {
  let tempInput = '';
  let tempOutput = '';

  try {
    if (!await validateAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Firebase-backed rate limiting for persistence across serverless instances
    const clientIP = getClientIP(request);
    const rateLimit = await checkFirebaseRateLimit(
      `compress_${clientIP}`,
      MAX_COMPRESS_ATTEMPTS,
      COMPRESS_RATE_LIMIT_WINDOW,
      COMPRESS_RATE_LIMIT_BLOCK
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter ?? COMPRESS_RATE_LIMIT_WINDOW / 1000) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = compressFileSchema.safeParse(body);

    if (!validation.success) {
      return validationError(validation.error);
    }

    const { filePath } = validation.data;

    // 1. Resolve Storage Path
    let storagePath = filePath;
    if (filePath.includes('/o/')) {
      const parts = filePath.split('/o/');
      storagePath = decodeURIComponent(parts[1].split('?')[0]);
    } else {
      storagePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    }

    if (!storagePath.startsWith('assets/')) {
      return NextResponse.json({ error: 'Only assets can be compressed' }, { status: 400 });
    }

    const ext = path.extname(storagePath).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif', '.icns'].includes(ext);
    if (!isImage) return NextResponse.json({ error: 'Only images supported' }, { status: 400 });

    // 2. Setup Work Paths
    const fileName = path.basename(storagePath);
    tempInput = path.join(os.tmpdir(), `in_${Date.now()}_${fileName}`);
    tempOutput = path.join(os.tmpdir(), `out_${Date.now()}_${baseName(fileName)}.webp`);

    // 3. Download from Firebase Storage
    const file = bucket.file(storagePath);
    const [exists] = await file.exists();
    if (!exists) return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });

    await file.download({ destination: tempInput });
    const originalSize = fs.statSync(tempInput).size;

    // 4. Compress with Sharp
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require('sharp');
    let sharpChain = sharp(tempInput);

    if (ext === '.icns') {
      // Simple ICNS to WebP conversion logic (taking first large block)
      sharpChain = sharpChain.resize(1024, 1024, { fit: 'inside', withoutEnlargement: true });
    } else {
      sharpChain = sharpChain.resize(1920, 1920, { fit: 'inside', withoutEnlargement: true });
    }

    await sharpChain.webp({ quality: 80, effort: 4 }).toFile(tempOutput);
    const newSize = fs.statSync(tempOutput).size;

    // 5. Upload back to Storage
    const targetPath = storagePath.replace(ext, '.webp');
    await bucket.upload(tempOutput, {
      destination: targetPath,
      metadata: { contentType: 'image/webp' }
    });

    // 6. Delete original if it was converted
    if (ext !== '.webp') {
      await file.delete().catch(e => console.warn('Original delete failed:', e));
    }

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(targetPath)}?alt=media`;

    return NextResponse.json({
      success: true,
      originalSize: (originalSize / (1024 * 1024)).toFixed(2) + ' MB',
      newSize: (newSize / (1024 * 1024)).toFixed(2) + ' MB',
      saved: ((1 - newSize / originalSize) * 100).toFixed(0) + '%',
      newPath: publicUrl
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Compression failed';
    console.error('[CompressAPI] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Cleanup /tmp
    if (tempInput && fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
    if (tempOutput && fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
  }
}

function baseName(str: string) {
  const base = new String(str).substring(str.lastIndexOf('/') + 1);
  if (base.lastIndexOf(".") !== -1) return base.substring(0, base.lastIndexOf("."));
  return base;
}
