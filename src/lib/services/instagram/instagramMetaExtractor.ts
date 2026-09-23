import { IG_USER_AGENT, fetchWithTimeout } from './instagramExtractUtils';
import type { ParsedInstagramUrl, InstagramMeta } from './types';

export function isInstagramUrl(input: string): boolean {
  try {
    const u = new URL(input.trim());
    return /(^|\.)instagram\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}

export function parseInstagramUrl(rawUrl: string): ParsedInstagramUrl | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (!/(^|\.)instagram\.com$/i.test(url.hostname)) {
    return null;
  }

  const match = url.pathname.match(/(?:^|\/)(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,})\/?/i);
  if (!match) return null;

  const rawType = match[1].toLowerCase();
  const mediaType: ParsedInstagramUrl['mediaType'] =
    rawType === 'tv' ? 'tv' : rawType === 'p' ? 'post' : 'reel';
  const shortcode = match[2];

  const canonicalSegment = mediaType === 'post' ? 'p' : mediaType === 'reel' ? 'reel' : 'tv';
  const canonicalUrl = `https://www.instagram.com/${canonicalSegment}/${shortcode}/`;

  return { shortcode, mediaType, canonicalUrl };
}

export function extractMetaContent(html: string, property: string): string | undefined {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["']`, 'i'),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

export function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });
}

export async function fetchInstagramMeta(url: string): Promise<InstagramMeta> {
  const html = await fetchWithTimeout(url, {
    headers: {
      'user-agent': IG_USER_AGENT,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    },
    cache: 'no-store',
  });

  return {
    title:
      decodeHtmlEntities(
        extractMetaContent(html, 'og:title') ?? extractMetaContent(html, 'twitter:title') ?? ''
      ) || undefined,
    description:
      decodeHtmlEntities(
        extractMetaContent(html, 'og:description') ??
          extractMetaContent(html, 'twitter:description') ??
          extractMetaContent(html, 'description') ??
          ''
      ) || undefined,
    image:
      decodeHtmlEntities(
        extractMetaContent(html, 'og:image') ?? extractMetaContent(html, 'twitter:image') ?? ''
      ) || undefined,
  };
}
