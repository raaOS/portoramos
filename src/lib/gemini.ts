import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * Lazy-initialized Gemini AI wrapper.
 *
 * Model dan API key hanya diinisialisasi saat pertama kali dipanggil
 * (bukan di module scope) untuk menghindari kegagalan saat cold start
 * serverless jika env vars belum tersedia.
 *
 * @module gemini
 */

/** Safety settings — konsisten untuk semua request. */
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/** Model name yang digunakan untuk semua generation request. */
const MODEL_NAME = 'gemini-2.0-flash';

/** Default timeout untuk API call (30 detik). */
const DEFAULT_TIMEOUT_MS = 30_000;

/** Maksimum retry attempts untuk transient failures. */
const MAX_RETRIES = 2;

/** Delay antara retry (ms), bertambah secara linear. */
const RETRY_BASE_DELAY_MS = 1000;

// Lazy-initialized instances
let _genAI: GoogleGenerativeAI | null = null;
let _model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

/**
 * Get the Gemini model instance (lazy-initialized, singleton).
 * @throws Error jika GEMINI_API_KEY tidak dikonfigurasi.
 */
function getModel() {
  if (_model) return _model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment');
  }

  _genAI = new GoogleGenerativeAI(apiKey);
  _model = _genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings: SAFETY_SETTINGS });

  return _model;
}

// Re-export for backward compatibility (lazy getter)
export const geminiModel = new Proxy({} as ReturnType<typeof getModel>, {
  get(_target, prop, receiver) {
    const model = getModel();
    const value = Reflect.get(model, prop, receiver);
    return typeof value === 'function' ? value.bind(model) : value;
  },
});

/**
 * Basic text generation with retry dan timeout.
 *
 * @param prompt - Input prompt untuk model
 * @param options - Opsi tambahan (timeout, max retries)
 * @returns Generated text
 * @throws Error jika generation gagal setelah semua retry
 *
 * @example
 * ```ts
 * const text = await generateText('Tulis deskripsi singkat tentang...');
 * ```
 */
export async function generateText(
  prompt: string,
  options?: { timeoutMs?: number; maxRetries?: number }
): Promise<string> {
  const model = getModel();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options?.maxRetries ?? MAX_RETRIES;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini API timeout after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryable =
        lastError.message.includes('timeout') ||
        lastError.message.includes('503') ||
        lastError.message.includes('429') ||
        lastError.message.includes('UNAVAILABLE');

      if (!isRetryable || attempt === maxRetries) {
        break;
      }

      // Linear backoff before retry
      const delay = RETRY_BASE_DELAY_MS * (attempt + 1);
      console.warn(`[Gemini] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error('[Gemini] Generation failed:', lastError);
  throw lastError;
}
