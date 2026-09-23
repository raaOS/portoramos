async function sleep(ms: number) {
  if (process.env.NODE_ENV === 'test') return;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchGeminiComments(
  apiKey: string,
  prompt: string,
  base64Data: string,
  mimeType: string
): Promise<string> {
  const modelCandidates = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };
  const requestBody: {
    contents: Array<{ parts: GeminiPart[] }>;
    generationConfig: { response_mime_type: string };
  } = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { response_mime_type: 'application/json' },
  };

  if (base64Data) {
    requestBody.contents[0].parts.push({
      inline_data: { mime_type: mimeType, data: base64Data },
    });
  }

  for (const model of modelCandidates) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    let response: Response | null = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
      } catch (err) {
        if (attempts >= maxAttempts) {
          console.warn(`[AI Comments] Gemini ${model} request error:`, err);
          break;
        }
        console.warn(`[AI Comments] Gemini ${model} request failed, retrying in 2s...`);
        await sleep(2000);
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        const data = (await response.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
        };
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const text = typeof candidateText === 'string' ? candidateText : '';
        if (text) {
          console.log(`[AI Comments] Comments generated via Gemini ${model}`);
          return text;
        }
      } else {
        console.warn(`[AI Comments] Gemini ${model} returned status ${response.status}`);
        if (response.status === 429 && attempts < maxAttempts) {
          console.warn(`[AI Comments] Gemini ${model} rate limited (429), retrying in 2s...`);
          await sleep(2000);
          continue;
        }
      }
      break;
    }
  }

  return '';
}

export async function fetchOpenRouterComments(
  apiKey: string,
  prompt: string,
  base64Data: string,
  mimeType: string
): Promise<string> {
  const modelCandidates = [
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'google/gemma-3-4b-it:free',
    'openrouter/free',
  ];

  type OpenRouterContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } };

  const messages: Array<{ role: 'user'; content: OpenRouterContentPart[] }> = [
    {
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    },
  ];

  if (base64Data && !mimeType.startsWith('video/')) {
    messages[0].content.push({
      type: 'image_url',
      image_url: {
        url: `data:${mimeType};base64,${base64Data}`,
      },
    });
  }

  for (const model of modelCandidates) {
    let response: Response | null = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      try {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Portfolio Shared Admin',
          },
          body: JSON.stringify({ model, messages, temperature: 0.5, max_tokens: 1200 }),
          signal: controller.signal,
        });
      } catch (err) {
        if (attempts >= maxAttempts) {
          console.warn(`[AI Comments] OpenRouter ${model} request error:`, err);
          break;
        }
        console.warn(`[AI Comments] OpenRouter ${model} request failed, retrying in 2s...`);
        await sleep(2000);
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: unknown } }>;
        };
        const content = data.choices?.[0]?.message?.content;
        const text = typeof content === 'string' ? content : '';
        if (text) {
          console.log(`[AI Comments] Comments generated via OpenRouter ${model}`);
          return text;
        }
      } else {
        const body = await response.text();
        console.warn(
          `[AI Comments] OpenRouter ${model} returned status ${response.status}: ${body.slice(0, 200)}`
        );
        if (response.status === 429 && attempts < maxAttempts) {
          console.warn(`[AI Comments] OpenRouter ${model} rate limited (429), retrying in 2s...`);
          await sleep(2000);
          continue;
        }
      }
      break;
    }
  }

  return '';
}
