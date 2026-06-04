import { NextRequest, NextResponse } from 'next/server';
import { getGeminiApiKey, getOpenRouterApiKey, guardAdminAiRequest } from '../_shared';
import { createHash } from 'node:crypto';
import { CacheManager } from '@/lib/cache/CacheManager';
import { deleteD1Value, getD1Value, isD1Configured, setD1Value } from '@/lib/cloudflareD1';

/**
 * Gemini AI Integration
 * Generates project details using Google's Gemini API.
 */
// API Timeout: 30 seconds
const API_TIMEOUT = 30000;
const REMOTE_MEDIA_TIMEOUT = 10000;
const MAX_REMOTE_MEDIA_BYTES = 8 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.ceil(MAX_REMOTE_MEDIA_BYTES * 1.4);
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PROMPT_VERSION = 'project-details-v2';

const modelCandidates = ['gemini-flash-latest', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_IMAGE_MODEL_CANDIDATES = [
  'openai/gpt-4o-mini',
  'openai/gpt-4.1-nano',
  'google/gemini-2.5-flash-lite',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'moonshotai/kimi-k2.6:free',
  'google/gemma-4-26b-a4b-it:free',
] as const;
const OPENROUTER_VIDEO_MODEL_CANDIDATES = [
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-flash',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'google/gemma-4-26b-a4b-it:free',
] as const;

const generateDetailsCache = new CacheManager({
  defaultTTL: CACHE_TTL_MS,
  maxSize: 100,
  label: 'AiGenerateDetailsCache',
});

interface GenerateDetailsCacheRecord {
  data: Record<string, unknown>;
  expiresAt: number;
  createdAt: number;
}

interface ProviderFailure {
  provider: 'gemini' | 'openrouter';
  status: number;
  body: string;
  model: string;
}

const DEFAULT_ALLOWED_REMOTE_MEDIA_HOSTS = [
  'images.unsplash.com',
  'plus.unsplash.com',
  'picsum.photos',
  'i.ibb.co',
  'i.postimg.cc',
  'images2.imgbox.com',
  'ui-avatars.com',
  'via.placeholder.com',
] as const;

const ALLOWED_REMOTE_MIME_PREFIXES = ['image/', 'video/mp4', 'video/webm'];

function validateRemoteMediaUrl(rawUrl: string) {
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

function getAllowedRemoteMediaHosts() {
  const hosts = new Set<string>(DEFAULT_ALLOWED_REMOTE_MEDIA_HOSTS);
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

  if (publicBaseUrl?.startsWith('https://')) {
    try {
      hosts.add(new URL(publicBaseUrl).hostname);
    } catch {
      // Ignore invalid optional config; upload/serve paths validate this separately.
    }
  }

  return hosts;
}

async function fetchUrlAsBase64(parsed: URL) {
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

async function fetchRemoteMediaAsBase64(rawUrl: string) {
  return fetchUrlAsBase64(validateRemoteMediaUrl(rawUrl));
}

async function fetchLocalMediaAsBase64(rawPath: string, requestUrl: string) {
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

function parseInlineBase64(payload: string) {
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

function guessMimeTypeFromPath(pathname: string) {
  const ext = pathname.split('.').pop()?.toLowerCase() || '';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function buildCacheKey(input: {
  base64Data: string;
  mimeType: string;
  style: string;
  maxTitleWords: number;
  sentenceCount: number;
}) {
  const mediaHash = createHash('sha256').update(input.base64Data).digest('hex');
  const optionHash = createHash('sha256')
    .update(
      JSON.stringify({
        promptVersion: PROMPT_VERSION,
        mimeType: input.mimeType,
        style: input.style,
        maxTitleWords: input.maxTitleWords,
        sentenceCount: input.sentenceCount,
      })
    )
    .digest('hex');

  return `generate-details:${mediaHash}:${optionHash}`;
}

async function readCachedDetails(cacheKey: string) {
  const memoryCached = generateDetailsCache.get<Record<string, unknown>>(cacheKey);
  if (memoryCached) return memoryCached;

  if (!isD1Configured()) return null;

  try {
    const persisted = await getD1Value<GenerateDetailsCacheRecord>(cacheKey);
    if (!persisted?.data || typeof persisted.expiresAt !== 'number') {
      return null;
    }

    if (Date.now() > persisted.expiresAt) {
      await deleteD1Value(cacheKey);
      return null;
    }

    generateDetailsCache.set(cacheKey, persisted.data, persisted.expiresAt - Date.now());
    return persisted.data;
  } catch (error) {
    console.warn('[AI Generate] Persistent cache read failed:', error);
    return null;
  }
}

async function writeCachedDetails(cacheKey: string, data: Record<string, unknown>) {
  generateDetailsCache.set(cacheKey, data);

  if (!isD1Configured()) return;

  try {
    const now = Date.now();
    await setD1Value(cacheKey, {
      data,
      createdAt: now,
      expiresAt: now + CACHE_TTL_MS,
    } satisfies GenerateDetailsCacheRecord);
  } catch (error) {
    console.warn('[AI Generate] Persistent cache write failed:', error);
  }
}

function isRetryableGeminiFailure(status: number, body: string) {
  return (
    status === 429 ||
    status === 503 ||
    status === 404 ||
    /quota|rate.?limit|too many requests|not found|unavailable/i.test(body)
  );
}

function toFriendlyGeminiError(status: number, body: string) {
  if (/quota|rate.?limit|too many requests/i.test(body) || status === 429) {
    return 'Gemini quota sedang habis untuk semua model yang dicoba. Isi manual dulu atau coba lagi nanti.';
  }

  if (/not found/i.test(body) || status === 404) {
    return 'Model Gemini yang tersedia di API key ini tidak bisa dipakai untuk generate detail.';
  }

  return `Gemini API Error: ${body}`;
}

function isRetryableOpenRouterFailure(status: number, body: string) {
  return (
    status === 400 ||
    status === 402 ||
    status === 404 ||
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /quota|rate.?limit|too many requests|not found|unavailable|insufficient|credit|model/i.test(
      body
    )
  );
}

function toFriendlyOpenRouterError(status: number, body: string) {
  if (status === 401 || /invalid.*key|unauthorized/i.test(body)) {
    return 'OpenRouter API key tidak valid. Cek OPENROUTER_API_KEY di .env.local.';
  }

  if (status === 402 || /credit|balance|payment|insufficient/i.test(body)) {
    return 'OpenRouter belum punya credit/akses cukup untuk model vision yang dicoba.';
  }

  if (status === 429 || /quota|rate.?limit|too many requests/i.test(body)) {
    return 'OpenRouter sedang kena rate limit. Coba lagi nanti atau pakai model lain.';
  }

  if (status === 404 || /not found|model/i.test(body)) {
    return 'Model vision OpenRouter yang dicoba tidak tersedia untuk key ini.';
  }

  return `OpenRouter API Error: ${body}`;
}

function toFriendlyProviderError(failure: ProviderFailure | null) {
  if (!failure) return 'No response from AI';

  if (failure.provider === 'openrouter') {
    return toFriendlyOpenRouterError(failure.status, failure.body);
  }

  return toFriendlyGeminiError(failure.status, failure.body);
}

function getOpenRouterModelCandidates(mimeType: string) {
  if (mimeType.startsWith('video/')) {
    return OPENROUTER_VIDEO_MODEL_CANDIDATES;
  }

  return OPENROUTER_IMAGE_MODEL_CANDIDATES;
}

function buildOpenRouterMediaPart(mimeType: string, base64Data: string) {
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  if (mimeType.startsWith('video/')) {
    return {
      type: 'video_url',
      video_url: {
        url: dataUrl,
      },
    };
  }

  return {
    type: 'image_url',
    image_url: {
      url: dataUrl,
    },
  };
}

function extractOpenRouterText(data: Record<string, unknown>) {
  const choices = data.choices;
  if (!Array.isArray(choices)) return '';

  const firstChoice = choices[0] as { message?: { content?: unknown } } | undefined;
  const content = firstChoice?.message?.content;

  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (
          part &&
          typeof part === 'object' &&
          'text' in part &&
          typeof (part as { text?: unknown }).text === 'string'
        ) {
          return (part as { text: string }).text;
        }
        return '';
      })
      .join('');
  }

  return '';
}

interface GenerateDetailsRequest {
  imageUrl?: string;
  imageBase64?: string;
  style?: string;
  maxTitleWords?: number;
  sentenceCount?: number;
}

export async function POST(req: NextRequest) {
  const guardResponse = await guardAdminAiRequest(req, 'ai_details');
  if (guardResponse) return guardResponse;

  const geminiApiKey = getGeminiApiKey();
  const openRouterApiKey = getOpenRouterApiKey();
  if (!geminiApiKey && !openRouterApiKey) {
    return NextResponse.json(
      { error: 'AI provider not configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY.' },
      { status: 500 }
    );
  }

  try {
    const {
      imageUrl,
      imageBase64,
      style = 'estetik',
      maxTitleWords = 5,
      sentenceCount = 2,
    } = (await req.json()) as GenerateDetailsRequest;

    if (!imageUrl && !imageBase64) {
      return NextResponse.json({ error: 'Image URL or Base64 is required' }, { status: 400 });
    }

    // Check if local file or remote URL
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (imageBase64) {
      // Direct base64 input (e.g. from Client FileReader)
      const parsedInline = parseInlineBase64(imageBase64);
      base64Data = parsedInline.base64Data;
      mimeType = parsedInline.mimeType;
      if (base64Data.length > MAX_BASE64_CHARS) {
        return NextResponse.json({ error: 'Image payload is too large' }, { status: 413 });
      }
    } else if (imageUrl) {
      if (
        imageUrl.startsWith('/r2/') ||
        imageUrl.startsWith('r2/') ||
        imageUrl.startsWith('/assets/') ||
        imageUrl.startsWith('assets/')
      ) {
        const localMedia = await fetchLocalMediaAsBase64(imageUrl, req.url);
        base64Data = localMedia.base64Data;
        mimeType = localMedia.mimeType;
      } else if (imageUrl.startsWith('http')) {
        // External Remote URL
        const remoteMedia = await fetchRemoteMediaAsBase64(imageUrl);
        base64Data = remoteMedia.base64Data;
        mimeType = remoteMedia.mimeType;
      }
    }

    if (!base64Data) {
      return NextResponse.json({ error: 'Unable to read media payload' }, { status: 400 });
    }

    const cacheKey = buildCacheKey({
      base64Data,
      mimeType,
      style,
      maxTitleWords,
      sentenceCount,
    });
    const cached = await readCachedDetails(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const prompt = `Analisis gambar ini secara mendalam. 
        BERTINDAK SEBAGAI: Desainer yang fokus pada detail, kualitas eksekusi, dan kejujuran dalam berkarya.
        
        TONE/GAYA BAHASA (WAJIB):
        - Style: "${style}" (Gunakan ini sebagai landasan, tapi tetap LOW PROFILE).
        - HINDARI: Hiperbola (revolusioner, luar biasa, terbaik), kata-kata "menjual diri", atau kesan haus pujian.
        - HINDARI: Bahasa "marketing" atau "branding" yang terlalu kaku dan terkesan "baca pasar".
        - TUJUAN: Merendah tapi tidak rendah. Tunjukkan kualitas lewat kejujuran proses dan detail, bukan lewat klaim besar.
        - BAHASA: Indonesia yang tenang, lugas, dan apa adanya. Bisa menggunakan istilah teknis jika perlu.
        
        Karakter Style:
        - professional: Fokus pada kejelasan fungsi, tanggung jawab eksekusi, dan keteraturan.
        - creative: Fokus pada rasa ingin tahu (curiosity), eksperimen kecil, dan eksplorasi visual.
        - minimalist: Fokus pada esensi, efisiensi, dan menghilangkan hal yang tidak perlu.
        
        Isi Detail:
        1. JUDUL: (max ${maxTitleWords} kata, deskriptif & tidak berlebihan)
        2. DESKRIPSI: (max ${sentenceCount} kalimat) Jelaskan inti visual secara jujur.
        3. CLIENT: (Identitas brand atau "Personal Exploration").
        4. TAGS: (3-5 kata kunci teknis).
        5. SOFTWARE: (Max 2 software UTAMA yang kemungkinan besar digunakan: photoshop, illustrator, indesign, figma, affinity_designer, affinity_photo, capcut, finalcut, davinci).
        6. TYPE: "visual_art" atau "commercial".
        
        CASE STUDY DETAILS (Berdasarkan pengamatan visual yang nyata):
        - ROLE: (Cth: "UI Execution", "Visual Development", "3D Modeling")
        - TEAM: (Cth: "Independent Project", "Small Group Collaboration")
        - TIMELINE: (Cth: "Short Sprint", "Weekend Exploration")
        
        NARRATIVE (Gunakan sudut pandang "Belajar & Berproses"):
        Jika Commercial:
        - challenge: (Konteks bisnis dan masalah utama apa yang menantang?)
        - solution: (Langkah apa yang kamu ambil untuk mencoba menyelesaikan masalah tersebut?)
        - impact: (Hasil kecil atau pelajaran apa yang didapat dari project ini?)
        
        Jika Visual Art:
        - concept: (Rasa ingin tahu atau eksperimen apa yang mendasari karya ini?)
        - process: (Bagaimana cara kamu mengerjakannya secara teknis?)
        - detail: (Detail kecil apa yang menarik untuk diperhatikan?)
        
        Output JSON murni:
        {
          "title": "...",
          "description": "...",
          "client": "...",
          "tags": "...",
          "software": ["photoshop", "figma"],
          "type": "commercial | visual_art",
          "role": "...",
          "team": "...",
          "timeline": "...",
          "narrative": {
             "challenge": "...", "solution": "...", "impact": "...",
             "concept": "...", "process": "...", "detail": "..."
          }
        }`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
      },
    };

    let text = '';
    let lastFailure: ProviderFailure | null = null;

    if (geminiApiKey) {
      for (const model of modelCandidates) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        let response: Response;
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          const body = await response.text();
          lastFailure = { provider: 'gemini', status: response.status, body, model };

          if (isRetryableGeminiFailure(response.status, body)) {
            console.warn(`[AI Generate] Gemini model ${model} unavailable, trying fallback.`);
            continue;
          }

          break;
        }

        const data = await response.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          console.log(`[AI Generate] Project details generated via ${model}`);
          break;
        }

        lastFailure = { provider: 'gemini', status: 500, body: 'No response from AI', model };
      }
    }

    if (!text && openRouterApiKey) {
      const mediaPart = buildOpenRouterMediaPart(mimeType, base64Data);

      for (const model of getOpenRouterModelCandidates(mimeType)) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        let response: Response;
        try {
          response = await fetch(OPENROUTER_ENDPOINT, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
              'X-Title': 'Portfolio Shared Admin',
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'user',
                  content: [{ type: 'text', text: prompt }, mediaPart],
                },
              ],
              temperature: 0.35,
              max_tokens: 1400,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          const body = await response.text();
          lastFailure = { provider: 'openrouter', status: response.status, body, model };

          if (isRetryableOpenRouterFailure(response.status, body)) {
            console.warn(`[AI Generate] OpenRouter model ${model} unavailable, trying fallback.`);
            continue;
          }

          break;
        }

        const data = (await response.json()) as Record<string, unknown>;
        text = extractOpenRouterText(data);
        if (text) {
          console.log(`[AI Generate] Project details generated via OpenRouter ${model}`);
          break;
        }

        lastFailure = {
          provider: 'openrouter',
          status: 500,
          body: 'No response from AI',
          model,
        };
      }
    }

    if (!text) {
      const status = lastFailure?.status || 500;
      return NextResponse.json(
        {
          error: toFriendlyProviderError(lastFailure),
          model: lastFailure?.model,
          provider: lastFailure?.provider,
        },
        { status }
      );
    }

    // Clean markdown and parse JSON safely
    const jsonText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[AI Generate] JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON response from AI' }, { status: 500 });
    }

    await writeCachedDetails(cacheKey, parsed);

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'AI request timed out. Please try again.' },
        { status: 504 }
      );
    }
    console.error('AI Generate Error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
