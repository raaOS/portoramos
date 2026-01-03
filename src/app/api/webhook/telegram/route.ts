
import { NextResponse } from 'next/server';
import { getTelegramConfig } from '@/lib/telegram';

export async function POST(request: Request) {
    try {
        const { botToken, chatId } = await getTelegramConfig();
        if (!botToken) {
            return NextResponse.json({ message: 'Bot not configured' }, { status: 500 });
        }

        const body = await request.json();

        // Basic logging so we can see what's coming in Vercel logs
        console.log('[Telegram Webhook] Received:', JSON.stringify(body, null, 2));

        if (body.message && body.message.text) {
            const incomingChatId = body.message.chat.id;
            const text = body.message.text;

            // PROFESSIONAL AUTO-REPLY
            // Instead of echoing, we send a polite automated response.

            const replyText = `👋 *Halo! Terima kasih sudah menghubungi.*\n\n` +
                `Saya adalah asisten virtual dari **Ramos**. Pesan Anda telah diterima.\n\n` +
                `Saat ini saya hanya bertugas mengirim notifikasi.\n` +
                `Untuk respons cepat, silakan:\n` +
                `🌐 Kunjungi Portofolio: [Klik Disini](https://portofolio-ramos.vercel.app)\n` +
                `📩 Isi Form Kontak: [Halaman Kontak](https://portofolio-ramos.vercel.app/contact)\n\n` +
                `_Have a nice day!_ ✨`;

            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: incomingChatId,
                    text: replyText,
                    parse_mode: 'Markdown'
                })
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[Telegram Webhook] Error:', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
