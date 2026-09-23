/**
 * Instagram Job Post Extractor
 *
 * Extract konten loker dari URL Instagram (post / reel / IGTV).
 */

import { CacheManager } from '@/lib/cache/CacheManager';
import type { InstagramExtractResult } from './instagram/types';
import {
  IG_CACHE_TTL_MS,
  composeSourceText,
} from './instagram/instagramExtractUtils';
import {
  isInstagramUrl,
  parseInstagramUrl,
  fetchInstagramMeta,
} from './instagram/instagramMetaExtractor';
import { ocrInstagramImage } from './instagram/instagramOcrService';

export type { InstagramExtractResult };
export { isInstagramUrl };

const cache = new CacheManager({
  defaultTTL: IG_CACHE_TTL_MS,
  maxSize: 100,
  label: 'InstagramExtractCache',
  enableMetrics: false,
});

/**
 * Extract konten loker dari URL IG.
 * Throws `INSTAGRAM_INVALID_URL` jika URL bukan post/reel/tv yang valid.
 * Throws `INSTAGRAM_EXTRACTION_FAILED` jika semua layer (caption + OCR) gagal.
 */
export async function extractInstagramJobText(rawUrl: string): Promise<string> {
  const result = await extractInstagram(rawUrl);
  return result.sourceText;
}

/**
 * Versi lengkap yang return semua field.
 */
export async function extractInstagram(rawUrl: string): Promise<InstagramExtractResult> {
  const parsed = parseInstagramUrl(rawUrl);
  if (!parsed) {
    throw new Error('INSTAGRAM_INVALID_URL');
  }

  const cacheKey = `ig:${parsed.shortcode}`;
  const cached = cache.get<InstagramExtractResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const meta = await fetchInstagramMeta(parsed.canonicalUrl);
  const caption = meta.description?.trim() ?? '';
  const thumbnailUrl = meta.image;

  let ocrText = '';
  if (thumbnailUrl) {
    try {
      ocrText = await ocrInstagramImage(thumbnailUrl);
    } catch (error) {
      console.warn('[InstagramExtract] OCR failed, falling back to caption only:', error);
    }
  }

  const sourceText = composeSourceText({
    url: parsed.canonicalUrl,
    title: meta.title,
    caption,
    ocrText,
  });

  if (!sourceText.trim() || sourceText.trim().length < 40) {
    throw new Error('INSTAGRAM_EXTRACTION_FAILED');
  }

  const result: InstagramExtractResult = {
    url: parsed.canonicalUrl,
    shortcode: parsed.shortcode,
    mediaType: parsed.mediaType,
    caption,
    ocrText,
    thumbnailUrl,
    sourceText,
  };

  cache.set(cacheKey, result);
  return result;
}

/** Reset cache. Hanya untuk testing. */
export function __resetInstagramExtractCacheForTesting(): void {
  cache.clear();
}

export function clearInstagramExtractCache(): number {
  const entriesCleared = cache.size;
  cache.clear();
  return entriesCleared;
}
