import {
  type ProviderFailure,
  type ProviderGenerationInput,
  type ProviderGenerationResult,
  sleep,
} from './types';

const API_TIMEOUT = 30000;
const GEMINI_MODEL_CANDIDATES = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

function isRetryableGeminiFailure(status: number, body: string) {
  return (
    status === 429 ||
    status === 503 ||
    status === 404 ||
    /quota|rate.?limit|too many requests|not found|unavailable/i.test(body)
  );
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
