import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  IG_USER_AGENT,
  IG_OCR_TIMEOUT_MS,
  IG_MAX_IMAGE_BYTES,
  fetchWithTimeout,
  withTimeout,
} from './instagramExtractUtils';

export async function fetchImageAsBuffer(
  imageUrl: string
): Promise<{ buffer: Buffer; mimeType: string }> {
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

export async function ocrInstagramImage(imageUrl: string): Promise<string> {
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
