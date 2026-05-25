import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import {
  buildR2PublicUrl,
  deleteFromR2,
  getMissingR2EnvKeys,
  isR2StorageConfigured,
  uploadToR2,
} from '@/lib/r2Storage';

export const runtime = 'nodejs';
// Ditingkatkan dari 60s. Encode video 1080p ~30 detik dengan preset `fast`
// + parallelize 2-3 task biasanya selesai 30-60s; preset `slow` sebelumnya
// bisa 90-180s untuk file besar. 300s = batas Vercel Pro/Hobby tier nodejs.
export const maxDuration = 300;

// FIXED (BUG-010): Valid filename characters
const VALID_FILENAME_REGEX = /^[a-zA-Z0-9_-]+$/;
const MAX_FILENAME_LENGTH = 100;

// Image compression contract:
//   - JPEG, PNG, WebP  -> resize + transcode to WebP q82 (one pipeline, one upload).
//   - GIF              -> passthrough (sharp would drop animation frames).
//   - SVG              -> passthrough (vector, already tiny).
//   - HEIC/HEIF/AVIF   -> resize + transcode to WebP q82 if sharp supports it.
// The original user-selected file is never written to R2 for compressible
// images; only the optimized buffer reaches storage.
const IMAGE_TRANSCODE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
]);
const IMAGE_MAX_DIMENSION = 3840; // 4K-class max edge; wallpapers downscale, smaller pass through.
const IMAGE_OUTPUT_QUALITY = 82;

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

interface OptimizedImageResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
  originalSize: number;
  optimizedSize: number;
  width?: number;
  height?: number;
}

/**
 * Compresses an image buffer to WebP using sharp.
 *
 * Returns the compressed buffer when smaller than the original; otherwise
 * falls back to the original to avoid pathological cases (e.g. already
 * tiny PNG icons that bloat under WebP). Animated GIFs and SVG are skipped
 * by the caller because they need other handling.
 */
async function optimizeImageBuffer(
  inputBuffer: Buffer,
  inputType: string
): Promise<OptimizedImageResult> {
  const { default: sharp } = await import('sharp');

  const pipeline = sharp(inputBuffer, { failOn: 'none' })
    .rotate() // Honor EXIF orientation, then strip metadata implicitly.
    .resize({
      width: IMAGE_MAX_DIMENSION,
      height: IMAGE_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: IMAGE_OUTPUT_QUALITY, effort: 4 });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  // If WebP somehow ended up larger (rare, e.g. very small inputs), keep
  // the original bytes but normalize the response shape.
  if (data.length >= inputBuffer.length) {
    return {
      buffer: inputBuffer,
      contentType: inputType,
      extension: extFromContentType(inputType) || 'bin',
      originalSize: inputBuffer.length,
      optimizedSize: inputBuffer.length,
      width: info.width,
      height: info.height,
    };
  }

  return {
    buffer: Buffer.from(data),
    contentType: 'image/webp',
    extension: 'webp',
    originalSize: inputBuffer.length,
    optimizedSize: data.length,
    width: info.width,
    height: info.height,
  };
}

function extFromContentType(type: string): string | null {
  switch (type) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/svg+xml':
      return 'svg';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    case 'image/avif':
      return 'avif';
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await validateAdminRequest(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Basic Validation
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/heic',
      'image/heif',
      'image/avif',
      'video/mp4',
      'video/webm',
      // Audio formats (used by SoundEffectsManager). Compressed server-side
      // to MP3 128k mono via `optimizeAudioForPortfolio`. WAV uploads can
      // shrink dramatically; already-encoded MP3 falls back to original
      // when re-encoding would not help.
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/webm',
      'audio/aac',
      'audio/mp4',
      'audio/x-m4a',
      'audio/flac',
    ];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    if (!isR2StorageConfigured()) {
      return NextResponse.json(
        {
          error: `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`,
        },
        { status: 500 }
      );
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    let buffer: Buffer<ArrayBufferLike> = originalBuffer;
    let contentType = file.type;

    const { searchParams } = new URL(req.url);
    const rawCustomFilename = searchParams.get('filename');
    const folderParam = searchParams.get('folder');
    const skipMainVideoOptimization = searchParams.get('skipMainVideoOptimization') === '1';
    const isVideoUpload = file.type.startsWith('video/');
    const isImageUpload = file.type.startsWith('image/');
    const isAudioUpload = file.type.startsWith('audio/');
    const isWallpaperFolder = folderParam === 'wallpapers';

    // FIXED (BUG-010): Sanitize custom filename
    const customFilename = sanitizeFilename(rawCustomFilename);
    if (rawCustomFilename && !customFilename) {
      return NextResponse.json(
        {
          error: 'Invalid filename. Use only alphanumeric characters, hyphens, and underscores.',
        },
        { status: 400 }
      );
    }

    // ---------- IMAGE: server-side compression ----------
    // We compress before deciding the final extension so .jpg uploads can
    // ship as .webp (= the actual on-disk content) without the client
    // having to know.
    let imageStats: {
      originalSize: number;
      optimizedSize: number;
      width?: number;
      height?: number;
    } | null = null;
    let audioStats: { originalSize: number; optimizedSize: number } | null = null;
    let optimizedExtensionOverride: string | null = null;

    if (isImageUpload && IMAGE_TRANSCODE_TYPES.has(file.type)) {
      const optimized = await optimizeImageBuffer(originalBuffer, file.type);
      buffer = optimized.buffer;
      contentType = optimized.contentType;
      optimizedExtensionOverride = optimized.extension;
      imageStats = {
        originalSize: optimized.originalSize,
        optimizedSize: optimized.optimizedSize,
        width: optimized.width,
        height: optimized.height,
      };
    } else if (isAudioUpload) {
      // Audio (sound effects, etc.) -> mono MP3 128k via ffmpeg.
      const { optimizeAudioForPortfolio } = await import('@/lib/audioOptimization');
      const optimized = await optimizeAudioForPortfolio(originalBuffer, file.type);
      buffer = optimized.buffer;
      contentType = optimized.contentType;
      optimizedExtensionOverride = optimized.extension;
      audioStats = {
        originalSize: optimized.originalSize,
        optimizedSize: optimized.optimizedSize,
      };
    }

    // Determine Name & Folder
    const sourceExt = file.name.split('.').pop() || '';
    const ext = isVideoUpload ? 'mp4' : optimizedExtensionOverride || sourceExt;
    let finalFilename: string;
    let targetDir: string;

    if (customFilename) {
      finalFilename = `${customFilename}.${ext}`;
      // Pre-existing default for the project form: when a custom filename
      // is provided without an explicit folder, place it under
      // `assets/projects`. New folders (sounds, wallpapers, …) honor the
      // user-supplied folder so a custom filename + dedicated bucket can
      // coexist (e.g. SoundEffectsManager pins `customFilename=startup`
      // and expects it to land in `assets/sounds`).
      if (folderParam === 'sounds') {
        targetDir = 'assets/sounds';
      } else if (folderParam === 'wallpapers') {
        targetDir = 'assets/wallpapers';
      } else if (folderParam && folderParam.startsWith('assets/')) {
        targetDir = folderParam;
      } else {
        targetDir = 'assets/projects';
      }
    } else if (folderParam === 'comparisons') {
      const rawSlug = searchParams.get('slug');
      const cleanSlug = rawSlug ? sanitizeFilename(rawSlug) : null;
      const cleanName = cleanSlug ? `${cleanSlug}-before` : file.name.split('.')[0];
      finalFilename = `${cleanName}.${ext}`;
      targetDir = 'assets/projects/comparisons';
    } else {
      // Strip the source extension first so we can append the canonical
      // one consistently (matters for images that get transcoded to a
      // different format than the user uploaded).
      const baseName = file.name
        .replace(/\.[^.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      finalFilename = isVideoUpload
        ? `${Date.now()}-${baseName}.mp4`
        : `${Date.now()}-${baseName}.${ext}`;

      // Respect the folder param if provided and safe
      if (
        folderParam &&
        (folderParam.startsWith('assets/') ||
          folderParam === 'temp' ||
          folderParam === 'wallpapers' ||
          folderParam === 'sounds')
      ) {
        if (folderParam === 'wallpapers') targetDir = 'assets/wallpapers';
        else if (folderParam === 'sounds') targetDir = 'assets/sounds';
        else targetDir = folderParam;
      } else {
        targetDir = 'assets/media';
      }
    }

    const storagePath = `${targetDir}/${finalFilename}`;
    let previewPath: string | null = null;
    let posterPath: string | null = null;
    let previewBuffer: Buffer | null = null;
    let posterBuffer: Buffer | null = null;
    let videoStats: {
      originalSize: number;
      optimizedSize: number;
      previewSize: number;
      posterSize: number;
    } | null = null;

    if (isVideoUpload) {
      const { optimizeVideoForPortfolio } = await import('@/lib/videoOptimization');
      const optimized = await optimizeVideoForPortfolio(originalBuffer, {
        // Wallpapers prioritize a small, predictable on-disk size, so
        // never pass the original through even if the encoder happens
        // to produce a slightly larger MP4. For other folders keep the
        // existing behavior to preserve quality on already-optimized
        // source MP4s.
        allowOriginalPassthrough: isWallpaperFolder ? false : file.type === 'video/mp4',
        // Wallpapers fill the whole screen, so push them through the
        // higher-resolution profile (1080p, CRF 20) instead of the
        // 720p default used by project media thumbnails.
        profile: isWallpaperFolder ? 'high' : 'standard',
        // Wallpaper TIDAK butuh preview clip 6s — wallpaper diputar
        // full di desktop background. Preview cuma dipakai untuk
        // hover preview di explorer/admin, yang tidak relevan untuk
        // wallpaper. Skip preview encode → cuma main + poster yang
        // di-generate. Wall-clock turun ~30-40%.
        skipPreview: isWallpaperFolder,
      });
      buffer = skipMainVideoOptimization ? originalBuffer : optimized.buffer;
      contentType = 'video/mp4';
      previewBuffer = optimized.previewBuffer;
      posterBuffer = optimized.posterBuffer;
      videoStats = {
        originalSize: optimized.originalSize,
        optimizedSize: buffer.length,
        previewSize: optimized.previewSize,
        posterSize: optimized.posterSize,
      };

      const basePath = storagePath.replace(/\.(mp4|webm|mov)$/i, '');
      // Preview path hanya di-set kalau preview buffer ada (wallpaper
      // skip preview, jadi previewPath null → tidak ada upload preview).
      previewPath = previewBuffer ? `${basePath}-preview.mp4` : null;
      posterPath = `${basePath}.jpg`;
    }

    const cacheControl = 'public, max-age=31536000, immutable';
    const [r2Main] = await Promise.all([
      uploadToR2({
        key: storagePath,
        body: buffer,
        contentType,
        cacheControl,
      }),
      ...(previewPath && previewBuffer
        ? [
            uploadToR2({
              key: previewPath,
              body: previewBuffer,
              contentType: 'video/mp4',
              cacheControl,
            }),
          ]
        : []),
      ...(posterPath && posterBuffer
        ? [
            uploadToR2({
              key: posterPath,
              body: posterBuffer,
              contentType: 'image/jpeg',
              cacheControl,
            }),
          ]
        : []),
    ]);

    return NextResponse.json({
      url: r2Main.url,
      previewUrl: previewPath ? buildR2PublicUrl(previewPath) : undefined,
      posterUrl: posterPath ? buildR2PublicUrl(posterPath) : undefined,
      videoStats,
      imageStats,
      audioStats,
      storageProvider: 'r2',
      success: true,
    });
  } catch (e) {
    console.error('Upload Error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await validateAdminRequest(req))) {
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

    if (!isR2StorageConfigured()) {
      return NextResponse.json(
        {
          error: `Cloudflare R2 env is incomplete. Missing: ${getMissingR2EnvKeys().join(', ')}`,
        },
        { status: 500 }
      );
    }

    await deleteFromR2(storagePath);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete Error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
