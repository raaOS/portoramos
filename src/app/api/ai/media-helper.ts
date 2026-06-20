/**
 * Media Helper Utilities for AI APIs
 * Centralizes fetching, parsing, and base64-encoding media files (images/videos).
 */

export const REMOTE_MEDIA_TIMEOUT = 10000;
export const MAX_REMOTE_MEDIA_BYTES = 8 * 1024 * 1024;
export const MAX_BASE64_CHARS = Math.ceil(MAX_REMOTE_MEDIA_BYTES * 1.4);

export const DEFAULT_ALLOWED_REMOTE_MEDIA_HOSTS = [
  'images.unsplash.com',
  'plus.unsplash.com',
  'picsum.photos',
  'i.ibb.co',
  'i.postimg.cc',
  'images2.imgbox.com',
  'ui-avatars.com',
  'via.placeholder.com',
] as const;

export const ALLOWED_REMOTE_MIME_PREFIXES = ['image/', 'video/mp4', 'video/webm'];

export function guessMimeTypeFromPath(pathname: string) {
  const ext = pathname.split('.').pop()?.toLowerCase() || '';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export function getAllowedRemoteMediaHosts() {
  const hosts = new Set<string>(DEFAULT_ALLOWED_REMOTE_MEDIA_HOSTS);
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

  if (publicBaseUrl?.startsWith('https://')) {
    try {
      hosts.add(new URL(publicBaseUrl).hostname);
    } catch {
      // Ignore invalid optional config
    }
  }

  return hosts;
}

export function validateRemoteMediaUrl(rawUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid image URL');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS media URLs are allowed');
  }

  if (!getAllowedRemoteMediaHosts().has(parsed.hostname)) {
    throw new Error('Unsupported remote media host');
  }

  return parsed;
}

export async function fetchUrlAsBase64(parsed: URL) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REMOTE_MEDIA_TIMEOUT);

  try {
    const response = await fetch(parsed, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_REMOTE_MEDIA_BYTES) {
      throw new Error('Remote media is too large');
    }

    const contentType = response.headers.get('content-type') || '';
    if (!ALLOWED_REMOTE_MIME_PREFIXES.some((prefix) => contentType.startsWith(prefix))) {
      throw new Error('Remote URL did not return a supported media type');
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_REMOTE_MEDIA_BYTES) {
      throw new Error('Remote media is too large');
    }

    const mimeType = contentType.split(';')[0]?.trim() || guessMimeTypeFromPath(parsed.pathname);
    return {
      base64Data: Buffer.from(arrayBuffer).toString('base64'),
      mimeType,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchRemoteMediaAsBase64(rawUrl: string) {
  return fetchUrlAsBase64(validateRemoteMediaUrl(rawUrl));
}

export async function fetchLocalMediaAsBase64(rawPath: string, requestUrl: string) {
  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const isAllowedPath =
    normalizedPath.startsWith('/r2/assets/') ||
    normalizedPath.startsWith('/r2/temp/') ||
    normalizedPath.startsWith('/assets/');

  if (!isAllowedPath) {
    throw new Error('Unsupported local media path');
  }

  return fetchUrlAsBase64(new URL(normalizedPath, requestUrl));
}

export function parseInlineBase64(payload: string) {
  const match = payload.match(/^data:([^;]+);base64,([\s\S]*)$/);
  if (match) {
    return {
      base64Data: match[2],
      mimeType: match[1],
    };
  }

  return {
    base64Data: payload,
    mimeType: 'image/jpeg',
  };
}
