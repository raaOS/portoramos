import { NextRequest, NextResponse } from 'next/server';

/**
 * Gemini AI Integration
 * Generates project details using Google's Gemini API.
 */
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

        // Check if local file or remote URL
        let base64Image = '';
        const isLocal = imageUrl.startsWith('/');

        if (isLocal) {
            // Read from local filesystem
            const fs = await import('fs/promises');
            const path = await import('path');
            const localPath = path.join(process.cwd(), 'public', imageUrl);

            try {
                const buffer = await fs.readFile(localPath);
                base64Image = buffer.toString('base64');
            } catch (err) {
                return NextResponse.json({ error: `File not found on server: ${imageUrl}` }, { status: 404 });
            }
        } else {
            // Existing Logic: Convert Cloudinary Video URL to Image (JPG) if necessary
            let targetUrl = imageUrl;
            if (imageUrl.includes('cloudinary') && (imageUrl.endsWith('.mp4') || imageUrl.endsWith('.webm'))) {
                targetUrl = imageUrl.replace(/\.(mp4|webm)$/i, '.jpg');
            }

            // Download image to buffer with User-Agent to avoid blocks
            const imageRes = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.statusText}`);
            const arrayBuffer = await imageRes.arrayBuffer();
            base64Image = Buffer.from(arrayBuffer).toString('base64');
        }

        // Call Gemini API
        // CRITICAL: Using 'gemini-flash-latest' as confirmed by scripts/magic-caption.js
        const model = 'gemini-flash-latest';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        const prompt = `Analisis gambar ini. Berikan detail berikut untuk portofolio desain/kreatif:
        1. JUDUL (max ${maxTitleWords} kata)
        2. DESKRIPSI (max ${sentenceCount} kalimat) dengan gaya bahasa ${style}.
        3. CLIENT (jika ada logo/teks merek, tulis namanya. Jika tidak, tulis "Personal Work" atau "Commission").
        4. TAGS (3-5 kata kunci teknis/style, contoh: "3D, Motion, Branding, Illustration").
        
      Catatan khusus untuk gaya Gen-Z: Gunakan bahasa santai yang sopan dan tidak berlebihan (lowkey/chill vibe).
      WAJIB DALAM BAHASA INDONESIA. 
      Output JSON murni: {"title": "...", "description": "...", "client": "...", "tags": "..."}`;

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
