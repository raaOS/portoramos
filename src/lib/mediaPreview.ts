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

/**
 * Returns *all* possible side-car poster URLs for a given video source,
 * in priority order. The current pipeline writes `.jpg`, but during the
 * earlier transcode era posters were stored as `.webp`. Entries from
 * that era often do not have an explicit `posterUrl` persisted (the
 * field was added later), so callers that derive poster URLs need to
 * try both extensions.
 *
 * Order: `.jpg` first (matches current convention, hot path), then
 * `.webp` as legacy fallback. Consumers should prefer the first URL
 * that loads successfully.
 *
 * Note: this only generates candidate URLs. It does not check whether
 * any of them actually exist in R2. The check happens implicitly when
 * the browser requests them — successful = render, failed = next
 * candidate or no poster.
 */
export function getVideoPosterCandidates(src?: string | null): string[] {
  if (!src || !isVideoSource(src)) return [];

  const { path, suffix } = splitSuffix(src);
  if (!ASSET_PATH_PATTERN.test(path)) return [];

  const base = path.replace(/\.(mp4|webm|mov)$/i, '');
  return [`${base}.jpg${suffix}`, `${base}.webp${suffix}`];
}

export function getVideoPreviewSource(src?: string | null): string {
  if (!src || !isVideoSource(src)) return src || '';

  const { path, suffix } = splitSuffix(src);
  if (!ASSET_PATH_PATTERN.test(path) || /-preview\.mp4$/i.test(path)) {
    return src;
  }

  return path.replace(/\.(mp4|webm|mov)$/i, '-preview.mp4') + suffix;
}
