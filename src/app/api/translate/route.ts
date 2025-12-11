import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
    try {
        const { text, targetLanguage = 'English' } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('Translation Error: GEMINI_API_KEY is not set.');
            return NextResponse.json({ error: 'Gemini API Key is missing in server environment.' }, { status: 500 });
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            // Function to try generating content with a specific model
            const generateWithModel = async (modelName: string) => {
                console.log(`Attempting translation with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = `Translate the following text to ${targetLanguage}. Maintain the original tone and formatting. Return ONLY the translation, no introductory text.\n\nText: "${text}"`;
                const result = await model.generateContent(prompt);
                return await result.response;
            };

            let response;
            const modelsToTry = [
                "gemini-flash-latest",
                "gemini-2.0-flash", // Keep as backup for when quota resets
                "gemini-2.0-flash-exp",
                "gemini-pro"
            ];

            let lastError;

            for (const modelName of modelsToTry) {
                try {
                    response = await generateWithModel(modelName);
                    break; // Success, exit loop
                } catch (error: any) {
                    console.warn(`Model ${modelName} failed:`, error.message);
                    lastError = error;
                    // Continue to next model
                }
            }

            if (!response) {
                // If all models failed, throw the last error
                throw lastError || new Error("All models failed");
            }

            const translation = response.text();
            console.log(`Translation success (${targetLanguage}):`, translation.substring(0, 20) + '...');
            return NextResponse.json({ translation });

        } catch (apiError: any) {
            console.error('Gemini SDK Error:', apiError);
            const errorMessage = apiError.message || 'Unknown error';

            if (errorMessage.includes('404')) {
                return NextResponse.json({
                    error: `Google API Error 404: The model is unavailable. This usually means the 'Generative Language API' is not enabled in your Google Cloud Console for this API Key.`
                }, { status: 404 });
            }

            return NextResponse.json({ error: `Translation Failed: ${errorMessage}` }, { status: 500 });
        }
    } catch (error) {
        console.error('Translation handler error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
