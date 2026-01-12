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
        const { imageUrl, imageBase64, style = 'estetik', maxTitleWords = 5, sentenceCount = 2 } = await req.json();

        if (!imageUrl && !imageBase64) {
            return NextResponse.json({ error: 'Image URL or Base64 is required' }, { status: 400 });
        }

        // Check if local file or remote URL
        let base64Data = '';

        if (imageBase64) {
            // Direct base64 input (e.g. from Client FileReader)
            // Remove prefix if present (data:image/jpeg;base64,)
            base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        } else {
            const isLocal = imageUrl.startsWith('/');

            if (isLocal) {
                // Read from local filesystem
                const fs = await import('fs/promises');
                const path = await import('path');
                const localPath = path.join(process.cwd(), 'public', imageUrl);

                try {
                    const buffer = await fs.readFile(localPath);
                    base64Data = buffer.toString('base64');
                } catch (err) {
                    return NextResponse.json({ error: `File not found on server: ${imageUrl}` }, { status: 404 });
                }
            } else {
                // Remote URL
                // Download image to buffer with User-Agent to avoid blocks
                const imageRes = await fetch(imageUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.statusText}`);
                const arrayBuffer = await imageRes.arrayBuffer();
                base64Data = Buffer.from(arrayBuffer).toString('base64');
            }
        }

        // Call Gemini API
        // CRITICAL: Using 'gemini-flash-latest' as confirmed by scripts/magic-caption.js
        const model = 'gemini-flash-latest';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        const prompt = `Analisis gambar ini secara mendalam. 
        BERTINDAK SEBAGAI: Senior Creative Designer yang sedang menulis case study portofolio sendiri.
        
        GAYA BAHASA (PENTING):
        - HINDARI bahasa robot/kaku seperti "Karya ini merupakan..." atau "Tujuannya adalah..."
        - HINDARI kata-kata klise/berlebihan.
        - Gunakan bahasa Indonesia yang NATURAL, lugas, dan to-the-point.
        - Bayangkan kamu sedang menceritakan project ini ke teman sesama desainer: Jujur, Spesifik, dan Profesional tapi Santai.
        
        Tentukan apakah ini "Visual Art" atau "Commercial Project".
        
        Berikan detail berikut:
        1. JUDUL: (max ${maxTitleWords} kata, catchy & singkat)
        2. DESKRIPSI: (max ${sentenceCount} kalimat) Ceritakan apa yang ada di visual dengan bahasa deskriptif tapi tidak puitis berlebihan.
        3. CLIENT: (Jika ada logo/brand, sebutkan. Jika tidak, "Personal Work").
        4. TAGS: (3-5 kata kunci teknis).
        5. TYPE: "visual_art" atau "commercial".
        
        CASE STUDY DETAILS (Isi sesuai Type):
        - ROLE: (Contoh spesifik: "Lead UI Designer", "3D Animator", bukan cuma "Designer")
        - TEAM: (Jujur: "Solo Project", "Collab with @username", "Agency Team")
        - TIMELINE: (Estimasi realistis: "2 Hari", "1 Sprint (2 Minggu)", "Weekend Project")
        
        NARRATIVE (Sesuaikan Type):
        Jika Commercial:
        - context: (Kenapa project ini ada? Langsung ke inti masalah. Cth: "Brand X butuh rebranding karena engagement turun.")
        - challenge: (Apa susahnya? Cth: "Deadline mepet 2 hari dan materi foto terbatas.")
        - solution: (Apa yang kamu lakukan? Cth: "Saya pakai pendekatan tipografi besar untuk menutupi kurangnya foto bagus.")
        - impact: (Dampak/Hasil - Gunakan kata prediksi yang humble seperti "Didesain untuk...", "Berpotensi...", jangan klaim angka palsu.)
        
        Jika Visual Art:
        - concept: (Ide gila apa di baliknya? Cth: "Eksperimen menggabungkan tekstur plastik dengan layout majalah jadul.")
        - process: (Teknik spesifik? Cth: "Scan kertas asli lalu di-layering di Photoshop, bukan full digital.")
        - detail: (Apa yang harus orang perhatikan? Cth: "Perhatikan noise grain di bagian shadow.")
        
        Output JSON murni validation key:
        {
          "title": "...",
          "description": "...",
          "client": "...",
          "tags": "...",
          "type": "commercial | visual_art",
          "role": "...",
          "team": "...",
          "timeline": "...",
          "narrative": {
             "context": "...", "challenge": "...", "solution": "...", "impact": "...",
             "concept": "...", "process": "...", "detail": "..."
          }
        }`;

        // Detect Mime Type
        const ext = imageUrl.split('.').pop()?.toLowerCase();
        let mimeType = "image/jpeg";
        if (ext === 'mp4') mimeType = "video/mp4";
        else if (ext === 'webm') mimeType = "video/webm";
        else if (ext === 'png') mimeType = "image/png";
        else if (ext === 'webp') mimeType = "image/webp";

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                response_mime_type: "application/json"
            }
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
