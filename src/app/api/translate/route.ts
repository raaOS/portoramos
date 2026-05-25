import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { enforceRequestRateLimit } from '@/lib/security/request';
import { getGeminiApiKey } from '@/app/api/ai/_shared';
import { z } from 'zod';

const MAX_TRANSLATE_REQUESTS = 20;
const TRANSLATE_WINDOW_MS = 60 * 1000;
const TRANSLATE_BLOCK_MS = 5 * 60 * 1000;

const translatePayloadSchema = z.object({
  text: z.string().max(5000).optional(),
  targetLanguage: z.string().max(50).optional(),
  fields: z.record(z.string(), z.string().max(5000)).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await enforceRequestRateLimit(
      req,
      'translate_post',
      MAX_TRANSLATE_REQUESTS,
      TRANSLATE_WINDOW_MS,
      TRANSLATE_BLOCK_MS
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const payload = translatePayloadSchema.safeParse(await req.json());
    if (!payload.success) {
      return NextResponse.json({ error: 'Invalid translation payload' }, { status: 400 });
    }

    const { text, targetLanguage: _targetLanguage, fields } = payload.data;

    // Mode 1: Translate multiple fields at once (object mode)
    // Mode 2: Translate a single text string
    const isMultiField = !!fields && typeof fields === 'object';

    if (!text && !isMultiField) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    let prompt: string;

    if (isMultiField) {
      // Multi-field mode: translate an object of key-value pairs at once
      const fieldEntries = Object.entries(fields as Record<string, string>)
        .filter(([, v]) => v && v.trim())
        .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
        .join(',\n  ');

      prompt = `System: You are an expert Indonesian-to-English translator specializing in creative design portfolios.
Your goal is to translate design-related content while maintaining a sophisticated, professional, and modern tone.
Preserve all formatting, case consistency, and technical terms (e.g., brand names, software).

Task: Translate the following JSON object values from Indonesian to English.
Return ONLY the JSON object with the same keys.

Input:
{
  ${fieldEntries}
}`;
    } else {
      // Single text mode (for comments or standalone text)
      prompt = `System: You are a professional translator for a design portfolio.
Translate the text naturally, ensuring it sounds professional and fits a high-end creative context.

Task: Translate the following text from Indonesian to English.
Return ONLY a valid JSON object: {"translation": "<translated text here>"}

Text to translate:
${text}`;
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

    if (isMultiField) {
      return NextResponse.json({ translations: parsed });
    } else {
      const translation = parsed.translation;
      if (!translation) {
        return NextResponse.json(
          { error: 'Translation missing from AI response' },
          { status: 500 }
        );
      }
      return NextResponse.json({ translation });
    }
  } catch (error: unknown) {
    console.error('Translation handler error:', error);
    return NextResponse.json({ error: 'Translation failed. Please try again.' }, { status: 500 });
  }
}
