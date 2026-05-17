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
  return VIDEO_EXTENSION_PATTERN.test(src);
}

export function getVideoPosterSource(src?: string | null): string | undefined {
  if (!src || !isVideoSource(src)) return undefined;

  const { path, suffix } = splitSuffix(src);
  if (!ASSET_PATH_PATTERN.test(path)) return undefined;

  return path.replace(/\.(mp4|webm|mov)$/i, '.jpg') + suffix;
}

export function getVideoPreviewSource(src?: string | null): string {
  if (!src || !isVideoSource(src)) return src || '';

  const { path, suffix } = splitSuffix(src);
  if (!ASSET_PATH_PATTERN.test(path) || /-preview\.mp4$/i.test(path)) {
    return src;
  }

  return path.replace(/\.(mp4|webm|mov)$/i, '-preview.mp4') + suffix;
}
