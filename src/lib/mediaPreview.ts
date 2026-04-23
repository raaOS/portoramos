const VIDEO_EXTENSION_PATTERN = /\.(mp4|webm|mov)([?#].*)?$/i;
const ASSET_PATH_PATTERN = /(^|\/)assets\//i;

function splitSuffix(src: string) {
  const match = src.match(/^([^?#]+)([?#].*)?$/);
  return {
    path: match?.[1] ?? src,
    suffix: match?.[2] ?? '',
  };
}

export function isVideoSource(src?: string | null): boolean {
  if (!src) return false;
  if (src.includes('firebasestorage.googleapis.com')) {
    const storagePath = getFirebaseStoragePath(src);
    return VIDEO_EXTENSION_PATTERN.test(storagePath ?? '');
  }

  return VIDEO_EXTENSION_PATTERN.test(src);
}

export function getVideoPosterSource(src?: string | null): string | undefined {
  if (!src || !isVideoSource(src)) return undefined;

  const firebasePoster = getFirebaseStorageVariant(src, 'poster');
  if (firebasePoster) return firebasePoster;

  const { path, suffix } = splitSuffix(src);
  if (!ASSET_PATH_PATTERN.test(path)) return undefined;

  return path.replace(/\.(mp4|webm|mov)$/i, '.jpg') + suffix;
}

export function getVideoPreviewSource(src?: string | null): string {
  if (!src || !isVideoSource(src)) return src || '';

  const firebasePreview = getFirebaseStorageVariant(src, 'preview');
  if (firebasePreview) return firebasePreview;

  const { path, suffix } = splitSuffix(src);
  if (!ASSET_PATH_PATTERN.test(path) || /-preview\.mp4$/i.test(path)) {
    return src;
  }

  return path.replace(/\.(mp4|webm|mov)$/i, '-preview.mp4') + suffix;
}

function getFirebaseStoragePath(src: string): string | null {
  try {
    const url = new URL(src);
    if (url.hostname === 'firebasestorage.googleapis.com') {
      const encodedPath = url.pathname.split('/o/')[1];
      return encodedPath ? decodeURIComponent(encodedPath) : null;
    }

    if (url.hostname === 'storage.googleapis.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      return parts.length > 1 ? parts.slice(1).join('/') : null;
    }
  } catch {
    return null;
  }

  return null;
}

function getFirebaseStorageVariant(src: string, variant: 'poster' | 'preview'): string | null {
  try {
    const url = new URL(src);
    const storagePath = getFirebaseStoragePath(src);
    if (!storagePath || !ASSET_PATH_PATTERN.test(storagePath)) return null;

    const variantPath = variant === 'poster'
      ? storagePath.replace(/\.(mp4|webm|mov)$/i, '.jpg')
      : storagePath.replace(/\.(mp4|webm|mov)$/i, '-preview.mp4');

    if (variantPath === storagePath) return null;

    if (url.hostname === 'firebasestorage.googleapis.com') {
      const bucketMatch = url.pathname.match(/\/b\/([^/]+)\/o\//);
      const bucketName = bucketMatch?.[1];
      if (!bucketName) return null;
      return `${url.origin}/v0/b/${bucketName}/o/${encodeURIComponent(variantPath)}?alt=media`;
    }

    if (url.hostname === 'storage.googleapis.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      const bucketName = parts[0];
      if (!bucketName) return null;
      return `${url.origin}/${bucketName}/${variantPath}`;
    }
  } catch {
    return null;
  }

  return null;
}
