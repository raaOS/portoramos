/**
 * Instagram Job Post Extractor
 *
 * Extract konten loker dari URL Instagram (post / reel / IGTV).
 *
 * Strategi (Tier A — zero-cost, mengandalkan resource yang sudah ada di repo):
 *   1. Validate & normalize URL (hanya /p/, /reel/, /tv/).
 *   2. Fetch HTML dengan User-Agent realistis dan parse OG meta tags
 *      (og:title, og:description, og:image).
 *   3. Kalau ada og:image, fetch image dan kirim ke Gemini Vision (gemini-2.0-flash)
 *      untuk OCR + ekstraksi info loker. Mayoritas loker IG berbentuk poster
 *      gambar, jadi caption saja jarang cukup.
 *   4. Gabungkan caption (og:description) + hasil OCR jadi satu blok teks.
 *   5. Cache hasil per-URL via CacheManager (TTL 7 hari) supaya tidak
 *      dobel hit Gemini setiap retry user.
 *
 * Output service ini sengaja berupa string mentah (caption + OCR text)
 * supaya bisa langsung di-feed ke `jobApplyService.prepare()` yang sudah
 * existing — sama seperti pola Glints di `prepareApplyPackage()`.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { CacheManager } from '@/lib/cache/CacheManager';

// ---------- Types ----------

export interface InstagramExtractResult {
  url: string;
  shortcode: string;
  mediaType: 'post' | 'reel' | 'tv';
  caption: string;
  ocrText: string;
  thumbnailUrl?: string;
  sourceText: string;
}

// ---------- Constants ----------

/**
 * IG sangat sensitif terhadap server-side User-Agent.
 * Mobile Safari iOS UA paling konsisten masih return OG meta lengkap
 * (per observasi 2026), tanpa langsung kena login wall hard redirect.
 */
const IG_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

const IG_FETCH_TIMEOUT_MS = 15_000;
const IG_OCR_TIMEOUT_MS = 30_000;
const IG_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari
const IG_MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB safety cap

// Cache disengaja module-level supaya re-use lintas request di runtime sama.
const cache = new CacheManager({
  defaultTTL: IG_CACHE_TTL_MS,
  maxSize: 100,
  label: 'InstagramExtractCache',
  enableMetrics: false,
});

// ---------- Public API ----------

/**
 * Type guard murah: deteksi URL IG tanpa mem-parse sepenuhnya.
 * Dipakai juga oleh `jobHuntService` untuk routing branch.
 */
export function isInstagramUrl(input: string): boolean {
  try {
    const u = new URL(input.trim());
    return /(^|\.)instagram\.com$/i.test(u.hostname);
  } catch {
    return false;
  }
}

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
 * Versi lengkap yang return semua field. Berguna untuk debugging
 * atau preview di handler kalau nanti dibutuhkan.
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
    // Login wall HTML kadang tetap return OK 200 tapi konten meta-nya tipis.
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

// ---------- URL parsing ----------

interface ParsedInstagramUrl {
  shortcode: string;
  mediaType: 'post' | 'reel' | 'tv';
  canonicalUrl: string;
}

function parseInstagramUrl(rawUrl: string): ParsedInstagramUrl | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (!/(^|\.)instagram\.com$/i.test(url.hostname)) {
    return null;
  }

  // Pola path yang valid:
  //   /p/<shortcode>/        → post
  //   /reel/<shortcode>/     → reel
  //   /tv/<shortcode>/       → IGTV
  //   /<username>/p/<shortcode>/ (older share format)
  //   /<username>/reel/<shortcode>/
  const match = url.pathname.match(/(?:^|\/)(p|reel|reels|tv)\/([A-Za-z0-9_-]{5,})\/?/i);
  if (!match) return null;

  const rawType = match[1].toLowerCase();
  const mediaType: ParsedInstagramUrl['mediaType'] =
    rawType === 'tv' ? 'tv' : rawType === 'p' ? 'post' : 'reel';
  const shortcode = match[2];

  // Normalisasi: selalu pakai canonical bentuk /p/, /reel/, /tv/ tanpa
  // username supaya cache key konsisten antar variasi share link.
  const canonicalSegment = mediaType === 'post' ? 'p' : mediaType === 'reel' ? 'reel' : 'tv';
  const canonicalUrl = `https://www.instagram.com/${canonicalSegment}/${shortcode}/`;

  return { shortcode, mediaType, canonicalUrl };
}

// ---------- HTML fetch & meta parse ----------

interface InstagramMeta {
  title?: string;
  description?: string;
  image?: string;
}

async function fetchInstagramMeta(url: string): Promise<InstagramMeta> {
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

function extractMetaContent(html: string, property: string): string | undefined {
  // IG meta bisa pakai property="og:..." atau name="og:...", urutan attribute juga bisa flip.
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

function decodeHtmlEntities(value: string): string {
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

// ---------- OCR via Gemini Vision ----------

async function ocrInstagramImage(imageUrl: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const { buffer, mimeType } = await fetchImageAsBuffer(imageUrl);

  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = [
    'Image ini adalah gambar dari postingan Instagram, kemungkinan besar berisi lowongan kerja (loker).',
    'Tugasmu: ekstrak SEMUA teks yang terlihat di image ini sebagaimana adanya, termasuk:',
    '- Judul / posisi',
    '- Nama perusahaan',
    '- Lokasi',
    '- Requirement / kualifikasi',
    '- Job description / responsibilities',
    '- Skill yang diminta',
    '- Salary / benefit',
    '- Cara apply / kontak (email, WA, link, dll.)',
    '- Deadline / tanggal',
    '',
    'Aturan output:',
    '- Return RAW TEXT plain saja, tanpa markdown, tanpa bullet, tanpa komentar tambahan.',
    '- Pertahankan urutan yang sama seperti di image dari atas ke bawah, kiri ke kanan.',
    '- Pisahkan blok logis dengan baris kosong.',
    '- Jangan menerjemahkan, jangan parafrase. Salin ulang teks asli.',
    '- Kalau image bukan loker / tidak ada teks yang relevan, balas dengan satu baris: NO_JOB_CONTENT',
  ].join('\n');

  // Coba beberapa model berurutan. Kalau quota gemini-2.0-flash habis (sering
  // pada free tier), fallback ke flash-lite / flash-latest yang punya kuota terpisah.
  // gemini-flash-latest dipakai di repo lain (scripts/magic-caption.js, beberapa /api/ai
  // routes) sehingga sudah confirmed available di project ini.
  const modelCandidates = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-flash-latest'];

  let lastError: unknown;
  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await withTimeout(
        model.generateContent([
          { text: prompt },
          { inlineData: { mimeType, data: buffer.toString('base64') } },
        ]),
        IG_OCR_TIMEOUT_MS,
        'INSTAGRAM_OCR_TIMEOUT'
      );

      const text = (await result.response).text().trim();
      if (!text || text === 'NO_JOB_CONTENT') {
        return '';
      }
      console.log(`[InstagramExtract] OCR success via ${modelName} (${text.length} chars)`);
      return text;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      // Hanya retry kalau quota / rate limit / model not found.
      // Untuk error lain (timeout, network, image rejected karena safety) langsung berhenti.
      if (!/429|quota|rate.?limit|404|not found/i.test(message)) {
        throw error;
      }
      console.warn(
        `[InstagramExtract] OCR unavailable on ${modelName} (${
          /429|quota|rate.?limit/i.test(message) ? 'quota' : 'model not found'
        }), trying next...`
      );
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchImageAsBuffer(imageUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
  // IG CDN (scontent.cdninstagram.com) menerapkan hotlink protection: tanpa
  // Referer dari instagram.com mereka return 403. UA pun perlu mobile/desktop
  // Safari supaya tidak diblok karena dianggap bot generic.
  const response = await fetchWithTimeout(
    imageUrl,
    {
      headers: {
        'user-agent': IG_USER_AGENT,
        referer: 'https://www.instagram.com/',
        accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9,id;q=0.8',
      },
      cache: 'no-store',
    },
    true
  );
  if (!(response instanceof Response)) {
    throw new Error('Unexpected fetch result for image');
  }

  const contentLength = Number(response.headers.get('content-length') ?? '0');
  if (contentLength && contentLength > IG_MAX_IMAGE_BYTES) {
    throw new Error('INSTAGRAM_IMAGE_TOO_LARGE');
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > IG_MAX_IMAGE_BYTES) {
    throw new Error('INSTAGRAM_IMAGE_TOO_LARGE');
  }

  const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg';
  return { buffer: Buffer.from(arrayBuffer), mimeType };
}

// ---------- Helpers ----------

/**
 * Overload kecil:
 *  - default: return body sebagai string
 *  - returnResponse=true: return Response objek (untuk binary/image)
 */
async function fetchWithTimeout(url: string, init: RequestInit): Promise<string>;
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  returnResponse: true
): Promise<Response>;
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  returnResponse?: boolean
): Promise<string | Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IG_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Instagram fetch failed (${response.status})`);
    }
    if (returnResponse) {
      return response;
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function composeSourceText(input: {
  url: string;
  title?: string;
  caption: string;
  ocrText: string;
}): string {
  const blocks: string[] = [];
  if (input.title) blocks.push(`[Instagram Post] ${input.title}`);
  blocks.push(`URL: ${input.url}`);
  if (input.caption) {
    blocks.push('--- Caption (dari og:description) ---');
    blocks.push(input.caption);
  }
  if (input.ocrText) {
    blocks.push('--- Teks dari Poster (OCR Gemini Vision) ---');
    blocks.push(input.ocrText);
  }
  return blocks.join('\n\n').trim();
}

// ---------- Test hooks ----------

/** Reset cache. Hanya untuk testing. */
export function __resetInstagramExtractCacheForTesting(): void {
  cache.clear();
}

export function clearInstagramExtractCache(): number {
  const entriesCleared = cache.size;
  cache.clear();
  return entriesCleared;
}
