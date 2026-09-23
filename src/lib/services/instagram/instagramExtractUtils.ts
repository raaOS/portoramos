export const IG_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

export const IG_FETCH_TIMEOUT_MS = 15_000;
export const IG_OCR_TIMEOUT_MS = 30_000;
export const IG_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari
export const IG_MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB safety cap

export async function fetchWithTimeout(url: string, init: RequestInit): Promise<string>;
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  returnResponse: true
): Promise<Response>;
export async function fetchWithTimeout(
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

export function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
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

export function composeSourceText(input: {
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
