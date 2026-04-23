import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return NextResponse.json({ error: 'Groq API Key not configured' }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as Blob | null;

        if (!file) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        // Forward to Groq Whisper API
        const groqFormData = new FormData();
        groqFormData.append('file', file, 'audio.webm');
        groqFormData.append('model', 'whisper-large-v3-turbo');
        // optional: groqFormData.append('language', 'id');

        const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${groqKey}`
            },
            body: groqFormData
        });

        if (!groqRes.ok) {
            const errorText = await groqRes.text();
            console.error('[Voice API] Groq Error:', errorText);
            return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
        }

        const data = await groqRes.json();
        
        return NextResponse.json({ text: data.text });
    } catch (error) {
        console.error('[Voice API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
