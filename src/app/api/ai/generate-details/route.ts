import { NextRequest, NextResponse } from 'next/server';

/**
 * Gemini AI Integration
 * Generates project details using Google's Gemini API.
 */
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

interface GenerateDetailsRequest {
    imageUrl?: string;
    imageBase64?: string;
    style?: string;
    maxTitleWords?: number;
    sentenceCount?: number;
}

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    try {
        const { imageUrl, imageBase64, style = 'estetik', maxTitleWords = 5, sentenceCount = 2 } = await req.json() as GenerateDetailsRequest;

        if (!imageUrl && !imageBase64) {
            return NextResponse.json({ error: 'Image URL or Base64 is required' }, { status: 400 });
        }

        // Check if local file or remote URL
        let base64Data = '';

        if (imageBase64) {
            // Direct base64 input (e.g. from Client FileReader)
            // Remove prefix if present (data:image/jpeg;base64,)
            base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        } else if (imageUrl) {
            const isLocal = imageUrl.startsWith('/');

            if (isLocal) {
                // Read from local filesystem
                const fs = await import('fs/promises');
                const path = await import('path');
                const localPath = path.join(process.cwd(), 'public', imageUrl);

                try {
                    const buffer = await fs.readFile(localPath);
                    base64Data = buffer.toString('base64');
                } catch (err: unknown) {
                    const errMsg = err instanceof Error ? err.message : String(err);
                    return NextResponse.json({ error: `File not found on server: ${imageUrl} - ${errMsg}` }, { status: 404 });
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
        BERTINDAK SEBAGAI: Desainer yang fokus pada detail, kualitas eksekusi, dan kejujuran dalam berkarya.
        
        TONE/GAYA BAHASA (WAJIB):
        - Style: "${style}" (Gunakan ini sebagai landasan, tapi tetap LOW PROFILE).
        - HINDARI: Hiperbola (revolusioner, luar biasa, terbaik), kata-kata "menjual diri", atau kesan haus pujian.
        - HINDARI: Bahasa "marketing" atau "branding" yang terlalu kaku dan terkesan "baca pasar".
        - TUJUAN: Merendah tapi tidak rendah. Tunjukkan kualitas lewat kejujuran proses dan detail, bukan lewat klaim besar.
        - BAHASA: Indonesia yang tenang, lugas, dan apa adanya. Bisa menggunakan istilah teknis jika perlu.
        
        Karakter Style:
        - professional: Fokus pada kejelasan fungsi, tanggung jawab eksekusi, dan keteraturan.
        - creative: Fokus pada rasa ingin tahu (curiosity), eksperimen kecil, dan eksplorasi visual.
        - minimalist: Fokus pada esensi, efisiensi, dan menghilangkan hal yang tidak perlu.
        
        Isi Detail:
        1. JUDUL: (max ${maxTitleWords} kata, deskriptif & tidak berlebihan)
        2. DESKRIPSI: (max ${sentenceCount} kalimat) Jelaskan inti visual secara jujur.
        3. CLIENT: (Identitas brand atau "Personal Exploration").
        4. TAGS: (3-5 kata kunci teknis).
        5. SOFTWARE: (Max 2 software UTAMA yang kemungkinan besar digunakan: photoshop, illustrator, indesign, figma, affinity_designer, affinity_photo, capcut, finalcut, davinci).
        6. TYPE: "visual_art" atau "commercial".
        
        CASE STUDY DETAILS (Berdasarkan pengamatan visual yang nyata):
        - ROLE: (Cth: "UI Execution", "Visual Development", "3D Modeling")
        - TEAM: (Cth: "Independent Project", "Small Group Collaboration")
        - TIMELINE: (Cth: "Short Sprint", "Weekend Exploration")
        
        NARRATIVE (Gunakan sudut pandang "Belajar & Berproses"):
        Jika Commercial:
        - context: (Kenapa project ini dibuat? Apa kebutuhan dasarnya?)
        - challenge: (Hal kecil apa yang menurutmu menantang saat pengerjaan?)
        - solution: (Langkah apa yang kamu ambil untuk mencoba menyelesaikan masalah tersebut?)
        - impact: (Hasil kecil atau pelajaran apa yang didapat dari project ini?)
        
        Jika Visual Art:
        - concept: (Rasa ingin tahu atau eksperimen apa yang mendasari karya ini?)
        - process: (Bagaimana cara kamu mengerjakannya secara teknis?)
        - detail: (Detail kecil apa yang menarik untuk diperhatikan?)
        
        Output JSON murni:
        {
          "title": "...",
          "description": "...",
          "client": "...",
          "tags": "...",
          "software": ["photoshop", "figma"],
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
        const ext = imageUrl?.split('.').pop()?.toLowerCase() || '';
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

    } catch (error: unknown) {
        console.error('AI Generate Error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
