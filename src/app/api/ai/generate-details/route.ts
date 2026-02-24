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
        BERTINDAK SEBAGAI: Senior Creative Strategist & Product Designer.
        
        TONE/GAYA BAHASA (WAJIB IKUTI):
        Style yang dipilih user: "${style}"
        
        ${style === 'professional' ? `
        - FOKUS: Problem-solving, hasil kerja yang reliabel, dan nilai bisnis.
        - BAHASA: Formal-elegan, meyakinkan, lugas.
        - TUJUAN: Menunjukkan bahwa project ini bisa menyelesaikan masalah klien.` : ''}
        ${style === 'creative' ? `
        - FOKUS: Inovasi, estetika yang berani, dan ide-ide out-of-the-box.
        - BAHASA: Inspiratif, penuh semangat, deskriptif kreatif.
        - TUJUAN: Menunjukkan sisi eksploratif dan keunikan visual.` : ''}
        ${style === 'minimalist' ? `
        - FOKUS: Kejelasan, esensialisme, dan kualitas detail kecil.
        - BAHASA: Sangat singkat, bersih, to-the-point tanpa 'fluff'.
        - TUJUAN: Menunjukkan ketajaman visi dan efisiensi desain.` : ''}
        
        ATURAN UMUM:
        - HINDARI bahasa robot/kaku seperti "Karya ini merupakan..." atau "Tujuannya adalah..."
        - HINDARI kata-kata klise berlebihan (revolutionary, game-changing).
        - Gunakan bahasa Indonesia yang NATURAL (bisa sedikit campur istilah Inggris teknis yang umum di industri).
        
        Tentukan tipe project (Visual Art atau Commercial).
        
        Isi Detail:
        1. JUDUL: (max ${maxTitleWords} kata, catchy & singkat)
        2. DESKRIPSI: (max ${sentenceCount} kalimat) Fokus pada "Apa nilai menarik dari visual ini?".
        3. CLIENT: (Identifikasi brand jika ada, jika tidak: "Personal Project").
        4. TAGS: (3-5 kata kunci teknis).
        5. TYPE: "visual_art" atau "commercial".
        
        CASE STUDY DETAILS (Generate yang BENAR-BENAR spesifik berdasarkan visual):
        - ROLE: (Cth: "Lead Brand Identity", "System Architect", "3D Surrealist")
        - TEAM: (Cth: "Solo Execution", "Modular Team Collaboration")
        - TIMELINE: (Cth: "48 Hours Sprint", "1 Month Production")
        
        NARRATIVE (Harus Terasa "Mahal" dan Menarik bagi Klien):
        Jika Commercial:
        - context: (Apa problem industrinya? Kenapa brand ini butuh solusi ini?)
        - challenge: (Apa hambatan teknis/strategis yang paling sulit?)
        - solution: (Langkah brilian apa yang kamu ambil sebagai desainer?)
        - impact: (Kenapa solusi ini bagus untuk masa depan brand?)
        
        Jika Visual Art:
        - concept: (Makna filosofis atau eksperimen teknis apa yang dikejar?)
        - process: (Langkah unik yang kamu lakukan, cth: "manual scanning", "procedural generation")
        - detail: (Spesifik area visual yang menunjukkan keahlianmu, cth: "lighting contrast", "subsurface scattering")
        
        Output JSON murni:
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
