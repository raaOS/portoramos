export interface ProviderFailure {
  provider: 'gemini' | 'openrouter';
  status: number;
  body: string;
  model: string;
}

export interface ProviderGenerationInput {
  apiKey: string;
  prompt: string;
  mimeType: string;
  base64Data: string;
}

export interface ProviderGenerationResult {
  text: string;
  lastFailure: ProviderFailure | null;
}

export async function sleep(ms: number) {
  if (process.env.NODE_ENV === 'test') return;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toFriendlyGeminiError(status: number, body: string) {
  if (/quota|rate.?limit|too many requests/i.test(body) || status === 429) {
    return 'Gemini quota sedang habis untuk semua model yang dicoba. Isi manual dulu atau coba lagi nanti.';
  }

  if (/not found/i.test(body) || status === 404) {
    return 'Model Gemini yang tersedia di API key ini tidak bisa dipakai untuk generate detail.';
  }

  return `Gemini API Error: ${body}`;
}

export function toFriendlyOpenRouterError(status: number, body: string) {
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

export function toFriendlyProviderError(failure: ProviderFailure | null) {
  if (!failure) return 'No response from AI';

  if (failure.provider === 'openrouter') {
    return toFriendlyOpenRouterError(failure.status, failure.body);
  }

  return toFriendlyGeminiError(failure.status, failure.body);
}
