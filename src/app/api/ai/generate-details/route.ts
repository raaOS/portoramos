import { NextRequest, NextResponse } from 'next/server';
import { getGeminiApiKey, guardAdminAiRequest } from '../_shared';

/**
 * Gemini AI Integration
 * Generates project details using Google's Gemini API.
 */
// API Timeout: 30 seconds
const API_TIMEOUT = 30000;
const REMOTE_MEDIA_TIMEOUT = 10000;
const MAX_REMOTE_MEDIA_BYTES = 8 * 1024 * 1024;
const MAX_BASE64_CHARS = Math.ceil(MAX_REMOTE_MEDIA_BYTES * 1.4);

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

    return Buffer.from(arrayBuffer).toString('base64');
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

  const API_KEY = getGeminiApiKey();
  if (!API_KEY) {
    return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
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

    if (imageBase64) {
      // Direct base64 input (e.g. from Client FileReader)
      base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
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
        base64Data = await fetchLocalMediaAsBase64(imageUrl, req.url);
      } else if (imageUrl.startsWith('http')) {
        // External Remote URL
        base64Data = await fetchRemoteMediaAsBase64(imageUrl);
      }
    }

    // Call Gemini API
    // CRITICAL: Using 'gemini-flash-latest' as confirmed by scripts/magic-caption.js
    const model = 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

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

    // Detect Mime Type
    const ext = imageUrl?.split('.').pop()?.toLowerCase() || '';
    let mimeType = 'image/jpeg';
    if (ext === 'mp4') mimeType = 'video/mp4';
    else if (ext === 'webm') mimeType = 'video/webm';
    else if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';

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

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    let response;
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
      const txt = await response.text();
      return NextResponse.json({ error: `Gemini API Error: ${txt}` }, { status: response.status });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
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
