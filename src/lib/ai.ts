import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * Multi-provider AI text generation wrapper.
 *
 * Priority chain: Groq (primary, ultra-fast) → OpenRouter (fallback) → Gemini (fallback).
 * Model dan API key hanya diinisialisasi saat pertama kali dipanggil
 * (bukan di module scope) untuk menghindari kegagalan saat cold start
 * serverless jika env vars belum tersedia.
 *
 * @module ai
 */

/** Safety settings — konsisten untuk request Gemini jika dipakai sebagai fallback. */
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

/** Model name default untuk Gemini fallback. */
const GEMINI_MODEL_NAME = 'gemini-2.0-flash';

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
 * Get the Gemini model instance (lazy-initialized, singleton fallback).
 * Returns null jika GEMINI_API_KEY tidak dikonfigurasi.
 */
function getGeminiModel() {
  if (_model) return _model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  _genAI = new GoogleGenerativeAI(apiKey);
  _model = _genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
    safetySettings: SAFETY_SETTINGS,
    tools: [{ googleSearchRetrieval: {} } as unknown as import('@google/generative-ai').Tool],
  });

  return _model;
}

// Lazy proxy export for backward compatibility with Gemini model consumers
export const geminiModel = new Proxy({} as ReturnType<GoogleGenerativeAI['getGenerativeModel']>, {
  get(_target, prop, receiver) {
    const model = getGeminiModel();
    if (!model) throw new Error('GEMINI_API_KEY is not configured in environment');
    const value = Reflect.get(model, prop, receiver);
    return typeof value === 'function' ? value.bind(model) : value;
  },
});

export const aiModel = geminiModel;

/**
 * Primary: generate text via Groq API (super cepat, gratis tier).
 */
async function generateViaGroq(prompt: string, timeoutMs: number): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  for (const model of models) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        console.warn(`[AI] Groq model ${model} failed with status ${res.status}`);
        continue;
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (error) {
      console.warn(
        `[AI] Groq model ${model} request failed:`,
        error instanceof Error ? error.message : error
      );
      continue;
    }
  }
  return null;
}

/**
 * Secondary: generate text via OpenRouter API (multi-model, gratis tier).
 */
async function generateViaOpenRouter(prompt: string, timeoutMs: number): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-coder-32b-instruct:free',
    'openrouter/free',
  ];

  for (const model of models) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        console.warn(`[AI] OpenRouter model ${model} failed with status ${res.status}`);
        continue;
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (error) {
      console.warn(
        `[AI] OpenRouter model ${model} request failed:`,
        error instanceof Error ? error.message : error
      );
      continue;
    }
  }
  return null;
}

/**
 * Tertiary / Fallback: generate text via Gemini API.
 */
async function generateViaGemini(
  prompt: string,
  timeoutMs: number,
  maxRetries: number
): Promise<string | null> {
  const model = getGeminiModel();
  if (!model) return null;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Gemini API timeout after ${timeoutMs}ms`)),
          timeoutMs
        );
      });

      const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
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

      const delay = RETRY_BASE_DELAY_MS * (attempt + 1);
      console.warn(`[AI] Gemini attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  console.warn('[AI] Gemini fallback failed:', lastError?.message);
  return null;
}

/**
 * Multi-provider text generation.
 *
 * Priority: Groq → OpenRouter → Gemini.
 *
 * @param prompt - Input prompt untuk model
 * @param options - Opsi tambahan (timeout, max retries)
 * @returns Generated text
 * @throws Error jika generation gagal di semua provider
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
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options?.maxRetries ?? MAX_RETRIES;

  // --- 1. Coba Groq (primary - super cepat & hemat kuota) ---
  const groqResult = await generateViaGroq(prompt, timeoutMs);
  if (groqResult) {
    return groqResult;
  }

  // --- 2. Coba OpenRouter (secondary fallback) ---
  const openRouterResult = await generateViaOpenRouter(prompt, timeoutMs);
  if (openRouterResult) {
    return openRouterResult;
  }

  // --- 3. Coba Gemini (tertiary fallback jika key tersedia) ---
  const geminiResult = await generateViaGemini(prompt, timeoutMs, maxRetries);
  if (geminiResult) {
    return geminiResult;
  }

  // --- Semua provider gagal ---
  throw new Error(
    'AI generation failed: no provider available. Please configure GROQ_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY.'
  );
}
