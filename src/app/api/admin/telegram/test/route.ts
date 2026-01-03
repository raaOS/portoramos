
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // Allow testing with custom credentials passed in body, or fallback?
        // Actually, for the "Test Ping" button, we likely want to test EXACTLY what's in the form fields.
        const body = await request.json();
        const { botToken, chatId } = body;

        if (!botToken || !chatId) {
            return NextResponse.json({ ok: false, message: 'Missing token or chat ID' }, { status: 400 });
        }

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: '👋 **Test Ping!**\n\nYour Telegram Bot is correctly connected to the Admin Panel.',
                parse_mode: 'Markdown'
            })
        });

        const data = await response.json();

        if (data.ok) {
            return NextResponse.json({ ok: true, message: 'Message sent successfully!' });
        } else {
            return NextResponse.json({ ok: false, message: `Telegram Error: ${data.description}` }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ ok: false, message: 'Server Network Error' }, { status: 500 });
    }
}
