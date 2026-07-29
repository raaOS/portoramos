const API_TIMEOUT = 30000;
const GEMINI_MODEL_CANDIDATES = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_IMAGE_MODEL_CANDIDATES = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-3-4b-it:free',
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
] as const;
const OPENROUTER_VIDEO_MODEL_CANDIDATES = [
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-3-4b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openrouter/free',
] as const;

async function sleep(ms: number) {
  if (process.env.NODE_ENV === 'test') return;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ProviderFailure {
  provider: 'gemini' | 'openrouter';
  status: number;
  body: string;
  model: string;
}

interface ProviderGenerationInput {
  apiKey: string;
  prompt: string;
  mimeType: string;
  base64Data: string;
}

interface ProviderGenerationResult {
  text: string;
  lastFailure: ProviderFailure | null;
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

export function toFriendlyProviderError(failure: ProviderFailure | null) {
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

type OpenRouterContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'video_url'; video_url: { url: string } };

function buildOpenRouterMediaPart(
  mimeType: string,
  base64Data: string,
  model: string
): OpenRouterContentPart | null {
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  if (mimeType.startsWith('video/')) {
    // Free models or gemini-2.5-flash-lite on OpenRouter do not support video_url payload.
    const isUnsupported = model.endsWith(':free') || model === 'google/gemini-2.5-flash-lite';
    if (isUnsupported) {
      return null;
    }

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

export async function generateWithGemini({
  apiKey,
  prompt,
  mimeType,
  base64Data,
}: ProviderGenerationInput): Promise<ProviderGenerationResult> {
  let lastFailure: ProviderFailure | null = null;

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

  for (const model of GEMINI_MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    let response: Response | null = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } catch (err) {
        if (attempts >= maxAttempts) throw err;
        console.warn(`[AI Generate] Gemini model ${model} fetch failed, retrying in 2s...`);
        await sleep(2000);
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        break;
      }

      const body = await response.text();
      lastFailure = { provider: 'gemini', status: response.status, body, model };

      if (response.status === 429 && attempts < maxAttempts) {
        console.warn(`[AI Generate] Gemini model ${model} rate limited (429), retrying in 2s...`);
        await sleep(2000);
        continue;
      }

      break;
    }

    if (!response || !response.ok) {
      if (lastFailure && isRetryableGeminiFailure(lastFailure.status, lastFailure.body)) {
        console.warn(`[AI Generate] Gemini model ${model} unavailable, trying fallback.`);
        continue;
      }
      break;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (text) {
      console.log(`[AI Generate] Project details generated via ${model}`);
      return { text, lastFailure };
    }

    lastFailure = { provider: 'gemini', status: 500, body: 'No response from AI', model };
  }

  return { text: '', lastFailure };
}

export async function generateWithOpenRouter({
  apiKey,
  prompt,
  mimeType,
  base64Data,
}: ProviderGenerationInput): Promise<ProviderGenerationResult> {
  let lastFailure: ProviderFailure | null = null;

  for (const model of getOpenRouterModelCandidates(mimeType)) {
    const mediaPart = buildOpenRouterMediaPart(mimeType, base64Data, model);

    const content: OpenRouterContentPart[] = [{ type: 'text', text: prompt }];
    if (mediaPart) {
      content.push(mediaPart);
    }

    let response: Response | null = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        response = await fetch(OPENROUTER_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Portfolio Shared Admin',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content,
              },
            ],
            temperature: 0.35,
            max_tokens: 1400,
          }),
          signal: controller.signal,
        });
      } catch (err) {
        if (attempts >= maxAttempts) throw err;
        console.warn(`[AI Generate] OpenRouter model ${model} fetch failed, retrying in 2s...`);
        await sleep(2000);
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        break;
      }

      const body = await response.text();
      lastFailure = { provider: 'openrouter', status: response.status, body, model };

      if (response.status === 429 && attempts < maxAttempts) {
        console.warn(`[AI Generate] OpenRouter model ${model} rate limited (429), retrying in 2s...`);
        await sleep(2000);
        continue;
      }

      break;
    }

    if (!response || !response.ok) {
      if (lastFailure && isRetryableOpenRouterFailure(lastFailure.status, lastFailure.body)) {
        console.warn(`[AI Generate] OpenRouter model ${model} unavailable, trying fallback.`);
        continue;
      }
      break;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const text = extractOpenRouterText(data);
    if (text) {
      console.log(`[AI Generate] Project details generated via OpenRouter ${model}`);
      return { text, lastFailure };
    }

    lastFailure = {
      provider: 'openrouter',
      status: 500,
      body: 'No response from AI',
      model,
    };
  }

  return { text: '', lastFailure };
}
