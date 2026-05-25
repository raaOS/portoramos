/**
 * Browser-side helper to capture a poster JPG from the first decodable frame
 * of a video file. Pairs with direct-to-R2 video uploads where the server
 * never sees the bytes and therefore can't run ffmpeg to produce the poster.
 *
 * Output is a JPG Blob (~50-200 KB at 1080p, q=0.82) that is small enough to
 * upload through the normal `/api/upload` route without hitting body limits.
 */

const POSTER_TIMEOUT_MS = 10000;
const POSTER_QUALITY = 0.82;
const POSTER_MAX_WIDTH = 1920;

export interface PosterCapture {
  blob: Blob;
  width: number;
  height: number;
}

export async function captureVideoPoster(file: File): Promise<PosterCapture> {
  if (typeof window === 'undefined') {
    throw new Error('captureVideoPoster hanya bisa dipanggil di browser');
  }
  if (!file.type.startsWith('video/')) {
    throw new Error('File bukan video');
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.src = url;

  try {
    // Tunggu metadata + frame pertama benar-benar siap di-decode. Tanpa
    // `seeked`, beberapa browser menggambar frame hitam ke canvas.
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        video.onloadeddata = null;
        video.onseeked = null;
        video.onerror = null;
      };
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error('Timeout saat mengambil frame video'));
      }, POSTER_TIMEOUT_MS);

      const finish = () => {
        window.clearTimeout(timer);
        cleanup();
        resolve();
      };

      video.onloadeddata = () => {
        // Seek ke 0.1s — beberapa codec start frame-nya hitam/blank.
        try {
          video.currentTime = 0.1;
        } catch {
          finish();
        }
      };
      video.onseeked = finish;
      video.onerror = () => {
        window.clearTimeout(timer);
        cleanup();
        reject(new Error('Gagal memutar video untuk poster'));
      };
    });

    const sourceWidth = video.videoWidth || 0;
    const sourceHeight = video.videoHeight || 0;
    if (!sourceWidth || !sourceHeight) {
      throw new Error('Dimensi video tidak terbaca');
    }

    // Downscale kalau lebih besar dari 1920 supaya poster tidak menjadi
    // file 2-3 MB di video 4K. Aspect ratio dipertahankan.
    const scale = sourceWidth > POSTER_MAX_WIDTH ? POSTER_MAX_WIDTH / sourceWidth : 1;
    const targetWidth = Math.round(sourceWidth * scale);
    const targetHeight = Math.round(sourceHeight * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser tidak mendukung canvas 2D');
    }
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', POSTER_QUALITY);
    });
    if (!blob) {
      throw new Error('Gagal mengkonversi frame ke JPG');
    }

    return { blob, width: targetWidth, height: targetHeight };
  } finally {
    URL.revokeObjectURL(url);
    // Free decoder memory.
    video.removeAttribute('src');
    video.load();
  }
}
