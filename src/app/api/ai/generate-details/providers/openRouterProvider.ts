import {
  type ProviderFailure,
  type ProviderGenerationInput,
  type ProviderGenerationResult,
  sleep,
} from './types';

const API_TIMEOUT = 30000;
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
