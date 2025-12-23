import { NextRequest, NextResponse } from 'next/server';

// Language code mapping for MyMemory
const languageMap: Record<string, string> = {
    'english': 'en',
    'indonesian': 'id',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt',
    'dutch': 'nl',
    'russian': 'ru',
    'chinese': 'zh-CN',
    'japanese': 'ja',
    'korean': 'ko',
    'arabic': 'ar',
    'hindi': 'hi',
    'turkish': 'tr',
    'polish': 'pl',
    'vietnamese': 'vi',
    'thai': 'th',
    'en': 'en',
    'id': 'id',
};

export async function POST(req: NextRequest) {
    try {
        const { text, targetLanguage = 'English' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Convert target language to code
        const targetCode = languageMap[targetLanguage.toLowerCase()] || 'en';

        // Smart source language: if target is English, assume source is Indonesian and vice versa
        const sourceCode = targetCode === 'en' ? 'id' : 'en';

        // Use MyMemory API (free, no key required, 10k words/day)
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${targetCode}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('MyMemory Error:', response.status);
            return NextResponse.json({
                error: `Translation service error: ${response.status}`
            }, { status: response.status });
        }

        const data = await response.json();

        if (data.responseStatus !== 200) {
            console.error('MyMemory API Error:', data.responseDetails);
            return NextResponse.json({
                error: data.responseDetails || 'Translation failed'
            }, { status: 500 });
        }

        const translation = data.responseData.translatedText;

        console.log(`Translation success (${targetLanguage}):`, translation.substring(0, 20) + '...');
        return NextResponse.json({ translation });

    } catch (error: any) {
        console.error('Translation handler error:', error);
        return NextResponse.json({
            error: 'Translation failed. Please try again.'
        }, { status: 500 });
    }
}
