
import { NextResponse } from 'next/server';
import { getTelegramConfig } from '@/lib/telegram';

export async function POST(request: Request) {
    try {
        const { url } = await request.json(); // The public URL of the Vercel deployment
        const { botToken } = await getTelegramConfig();

        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 400 });
        }

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const webhookUrl = `${url}/api/webhook/telegram`;

        const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: webhookUrl })
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { botToken } = await getTelegramConfig();
        if (!botToken) return NextResponse.json({ error: 'No token' }, { status: 400 });

        const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
        const data = await res.json();

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    // Check webhook info
    try {
        const { botToken } = await getTelegramConfig();
        if (!botToken) return NextResponse.json({ error: 'No token' }, { status: 400 });

        const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const data = await res.json();

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
