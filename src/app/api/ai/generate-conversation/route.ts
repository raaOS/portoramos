import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    try {
        const { senderName, notifMessage } = await req.json();

        if (!senderName || !notifMessage) {
            return NextResponse.json({ error: 'Sender name and notification message are required' }, { status: 400 });
        }

        const model = 'gemini-flash-latest';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        const prompt = `BERTINDAK SEBAGAI: Senior Creative Designer dengan nama "Ramos".
        
        TUGAS: Buatlah simulasi percakapan WhatsApp yang natural dan koheren antara Ramos (SAYA) dan "${senderName}" (DIA).
        
        KONTEKS AWAL:
        - "${senderName}" baru saja mengirimkan notifikasi WhatsApp kepada Ramos dengan pesan: "${notifMessage}".
        
        GAYA BAHASA:
        - Bahasa Indonesia Gaul/Natural WhatsApp (pakai singkatan wajar seperti 'yg', 'sdh', 'ok', 'sy', 'bisa', 'siap').
        - Ramos (SAYA) harus merespons secara profesional tapi santai, menunjukkan dia ahli di bidangnya (Desain Visual/Graphic Design).
        - Percakapan harus nyambung dengan isi pesan awal.
        - Jika pesan awal tentang tawaran kerja/proyek, bahas ke arah teknis atau rasa terima kasih.
        - Maksimal 4-6 balon chat tambahan (total alur yang pas).
        
        FORMAT OUTPUT: JSON array murni berisi objek ChatMessage.
        Setiap objek harus memiliki:
        - id: number (dimulai dari current + 1, buat saja urutan unik sederhana)
        - text: string (isi pesan)
        - isMe: boolean (true jika dari Ramos/SAYA, false jika dari ${senderName}/DIA)
        - time: string (HH:mm format, lanjutkan dari waktu sekarang/wajar)
        - status: "read"
        
        BUAT ALUR YANG MASUK AKAL:
        1. Respon dari Ramos (isMe: true)
        2. Balasan dari ${senderName} (isMe: false)
        3. Dst...
        
        Output JSON murni:
        [
          { "id": 1, "text": "...", "isMe": true, "time": "...", "status": "read" },
          ...
        ]`;

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
        console.error('AI Generate Conversation Error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
