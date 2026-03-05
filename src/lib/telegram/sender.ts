/**
 * Telegram message sender utilities
 */

export async function sendImmediate(
    chatId: string, 
    text: string, 
    botToken: string,
    threadId?: number
): Promise<void> {
    try {
        const payload: { 
            chat_id: string; 
            text: string; 
            parse_mode: string;
            message_thread_id?: number;
        } = {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        };
        if (threadId) {
            payload.message_thread_id = threadId;
        }

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error('[sendImmediate] Error:', e);
    }
}

export async function sendMessage(
    chatId: string,
    text: string,
    botToken: string,
    options?: {
        threadId?: number;
        replyMarkup?: unknown;
    }
): Promise<void> {
    const payload: { 
        chat_id: string; 
        text: string; 
        parse_mode: string;
        message_thread_id?: number;
        reply_markup?: unknown;
    } = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
    };
    
    if (options?.threadId) {
        payload.message_thread_id = options.threadId;
    }
    
    if (options?.replyMarkup) {
        payload.reply_markup = options.replyMarkup;
    }

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}
