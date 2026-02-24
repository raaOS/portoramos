import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const { text, targetLanguage = 'English', fields } = await req.json();

        // Mode 1: Translate multiple fields at once (object mode)
        // Mode 2: Translate a single text string
        const isMultiField = !!fields && typeof fields === 'object';

        if (!text && !isMultiField) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });

        let prompt: string;

        if (isMultiField) {
            // Multi-field mode: translate an object of key-value pairs at once
            const fieldEntries = Object.entries(fields as Record<string, string>)
                .filter(([, v]) => v && v.trim())
                .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
                .join(',\n  ');

            prompt = `You are a professional translator. Translate the following content from Indonesian to English. 
This is content from a design portfolio website. Preserve meaning, tone, and formatting.
Return ONLY a valid JSON object with the same keys, with translated values.

Input:
{
  ${fieldEntries}
}`;
        } else {
            // Single text mode (for comments or standalone text)
            prompt = `You are a professional translator. Translate the following text from Indonesian to English.
This is a comment or description from a design portfolio website. Keep the tone natural and preserve the original meaning.
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
                return NextResponse.json({ error: 'Translation missing from AI response' }, { status: 500 });
            }
            return NextResponse.json({ translation });
        }

    } catch (error) {
        console.error('Translation handler error:', error);
        return NextResponse.json(
            { error: 'Translation failed. Please try again.' },
            { status: 500 }
        );
    }
}
