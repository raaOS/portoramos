import { NextRequest, NextResponse } from 'next/server';
import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

// Rate limiting: 10 requests per minute, block 5 minutes
const MAX_AI_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}|${userAgent}`;
}

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    // Rate limiting check
    const clientId = getClientIdentifier(req);
    const rateLimit = await checkFirebaseRateLimit(
        `ai_notif_${clientId}`,
        MAX_AI_REQUESTS,
        RATE_LIMIT_WINDOW,
        BLOCK_DURATION
    );

    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.', retryAfter: rateLimit.retryAfter },
            { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
        );
    }

    try {
        const { senderName } = await req.json();

        if (!senderName) {
            return NextResponse.json({ error: 'Sender name is required' }, { status: 400 });
        }

        const model = 'gemini-flash-latest';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        const prompt = `BERTINDAK SEBAGAI: WhatsApp Notification Generator.
        
        TUGAS: Buatlah 1 (Satu) baris pesan notifikasi WhatsApp yang kreatif dan masuk akal dari pengirim bernama "${senderName}" untuk Ramos.
        
        GAYA BAHASA:
        - Bahasa Indonesia Natural (WA).
        - Singkat, padat, menarik (Maks 10 kata).
        - Bisa berupa ajakan meeting, testimoni, tanya kabar, atau tawaran kerja.
        
        CONTOH:
        - Jika "Rini HRD": "Halo Ramos, ada waktu untuk interview besok?"
        - Jika "BCA": "Transfer masuk Rp 5.000.000 dari Client X."
        - Jika "Gojek": "Pesanan sate ayam kamu sudah sampai depan pagar!"
        
        Output JSON murni:
        { "message": "..." }`;

        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
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
            throw new Error(`Gemini API Error: ${txt}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response from AI');
        }

        const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonText);

        return NextResponse.json(parsed);

    } catch (error: unknown) {
        console.error('AI Generate Notif Message Error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
