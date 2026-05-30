/**
 * Browser-side helper untuk membaca dimensi video tanpa upload dulu.
 * Pakai object URL + <video> element supaya browser cuma decode metadata
 * (cepat, tidak download seluruh file kalau byte range bekerja).
 *
 * Berguna untuk: validasi resolusi minimum sebelum admin commit upload
 * (mis. wallpaper minta minimal 1920x1080).
 */
/**
 * Dimensi video lengkap (width × height + durasi). Diisi oleh
 * `readVideoDimensions`.
 */
export interface VideoDimensions {
  width: number;
  height: number;
  durationSeconds: number;
}

/**
 * Dimensi 2D minimal — cukup untuk validasi resolusi (`checkMinResolution`).
 * Berlaku untuk video DAN image. Image dimensi diambil via
 * `detectImageDimensions` di `lib/media.ts`, video via `readVideoDimensions`
 * di file ini.
 */
export interface MediaDimensions {
  width: number;
  height: number;
}

const METADATA_TIMEOUT_MS = 8000;

export async function readVideoDimensions(file: File): Promise<VideoDimensions> {
  if (typeof window === 'undefined') {
    throw new Error('readVideoDimensions hanya bisa dipanggil di browser');
  }
  if (!file.type.startsWith('video/')) {
    throw new Error('File bukan video');
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  // playsInline supaya iOS Safari tidak fullscreen
  video.playsInline = true;
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        video.onloadedmetadata = null;
        video.onerror = null;
      };
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error('Timeout saat membaca metadata video'));
      }, METADATA_TIMEOUT_MS);

      video.onloadedmetadata = () => {
        window.clearTimeout(timer);
        cleanup();
        resolve();
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        cleanup();
        reject(new Error('Gagal membaca metadata video'));
      };
    });

    return {
      width: video.videoWidth || 0,
      height: video.videoHeight || 0,
      durationSeconds: Number.isFinite(video.duration) ? video.duration : 0,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface MinResolutionCheck {
  ok: boolean;
  width: number;
  height: number;
  reason?: string;
}

/**
 * Cek apakah media memenuhi resolusi minimum. Berlaku untuk video maupun
 * image. Untuk wallpaper desktop yang tampil fullscreen, target minimum
 * 1920x1080 supaya `object-cover` di layar 1080p+ tidak harus upsample
 * (yang bikin pecah).
 *
 * Catatan: portrait juga oke selama dimensi terbesar >= minWidth dan
 * lainnya >= minHeight. Tapi karena wallpaper desktop landscape-first, kita
 * enforce orientasi standar.
 */
export function checkMinResolution(
  dim: MediaDimensions,
  minWidth = 1920,
  minHeight = 1080
): MinResolutionCheck {
  const { width, height } = dim;

  if (!width || !height) {
    return {
      ok: false,
      width,
      height,
      reason: 'Resolusi video tidak terbaca',
    };
  }

  if (width < minWidth || height < minHeight) {
    return {
      ok: false,
      width,
      height,
      reason: `Resolusi ${width}x${height} di bawah minimum ${minWidth}x${minHeight}`,
    };
  }

  return { ok: true, width, height };
}
