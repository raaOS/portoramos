/**
 * Telegram Message Sender Utilities
 * 
 * This module handles the actual HTTP requests to the Telegram Bot API.
 */

import type { ReplyMarkup } from './types';

/**
 * Send a message immediately without going through the queue
 */
export async function sendImmediate(
    chatId: string,
    text: string,
    botToken: string,
    threadId?: number
) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const body: any = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
    };

    if (threadId) {
        body.message_thread_id = threadId;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('[Telegram Sender] Immediate send error:', error.description);
        }

        return response;
    } catch (error) {
        console.error('[Telegram Sender] Network error:', error);
        throw error;
    }
}

/**
 * Send a message with options (threadId, replyMarkup)
 */
export async function sendMessage(
    chatId: string,
    text: string,
    botToken: string,
    options?: {
        threadId?: number;
        replyMarkup?: ReplyMarkup;
    }
) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const body: any = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
    };

    if (options?.threadId) {
        body.message_thread_id = options.threadId;
    }

    if (options?.replyMarkup) {
        body.reply_markup = options.replyMarkup;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('[Telegram Sender] Message send error:', error.description);
        }

        return response;
    } catch (error) {
        console.error('[Telegram Sender] Network error:', error);
        throw error;
    }
}
