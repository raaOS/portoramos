import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    try {
        const { imageUrl, style = 'estetik', maxTitleWords = 5, sentenceCount = 2 } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // Convert Cloudinary Video URL to Image (JPG) if necessary
        let targetUrl = imageUrl;
        if (imageUrl.includes('cloudinary') && imageUrl.endsWith('.mp4')) {
            targetUrl = imageUrl.replace('.mp4', '.jpg');
        }

        // Download image to buffer with User-Agent to avoid blocks
        const imageRes = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.statusText}`);
        const arrayBuffer = await imageRes.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        // Call Gemini API
        const model = 'gemini-1.5-flash-latest'; // Using the latest alias for stability
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        const prompt = `Analisis gambar ini. Berikan JUDUL (max ${maxTitleWords} kata) dan DESKRIPSI (max ${sentenceCount} kalimat) dengan gaya bahasa ${style} untuk portofolio desain/kreatif. 
      Catatan khusus untuk gaya Gen-Z: Gunakan bahasa santai yang sopan dan tidak berlebihan (lowkey/chill vibe).
      WAJIB DALAM BAHASA INDONESIA. 
      Output JSON murni: {"title": "...", "description": "..."}`;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Image
                        }
                    }
                ]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const txt = await response.text();
            return NextResponse.json({ error: `Gemini API Error: ${txt}` }, { status: response.status });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
        }

        // Clean markdown
        const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonText);

        return NextResponse.json(parsed);

    } catch (error: any) {
        console.error('AI Generate Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
