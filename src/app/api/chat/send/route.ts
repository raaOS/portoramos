import { NextResponse } from 'next/server';
import { getTelegramConfig } from '@/lib/telegram';
import { chatStore } from '@/lib/chatStore';

export async function POST(request: Request) {
    try {
        const { botToken, chatId: adminChatId } = await getTelegramConfig();
        if (!botToken || !adminChatId) {
            return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
        }

        const body = await request.json();
        const { message, visitorId, pageUrl } = body;

        if (!message || !visitorId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Add message to local store
        const chatMsg = chatStore.addVisitorMessage(visitorId, message);

        // 2. Format message for Admin
        const text = `🌐 *New Web Chat Message*\n_ID: ${visitorId.substring(0, 6)}_\n\n💬 "${message}"\n\n_Reply to this message to chat back!_`;

        // 3. Send to Telegram
        const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminChatId,
                text: text,
                parse_mode: 'Markdown'
            })
        });

        const tgData = await tgResponse.json();

        // 4. If successful, map the Telegram Message ID back to our local store
        if (tgData.ok && tgData.result?.message_id) {
            // We update the local message to map it to the TG message
            // This is handled inside chatStore in a more robust way by directly updating the session.
            // But for now, we just update the session's overall telegramMessageId.
            const session = chatStore.getSession(visitorId);
            if (session) {
                session.telegramMessageId = tgData.result.message_id;
                // Manually add the mapping since we didn't pass it in step 1
                chatStore.addVisitorMessage(visitorId, "(hidden-sync)", tgData.result.message_id);
                // We pop the hidden sync off, but the mapping is registered.
                session.messages.pop();
            }
        }

        return NextResponse.json({ success: true, message: chatMsg });

    } catch (error) {
        console.error('[Web Chat Send Error]:', error);
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
