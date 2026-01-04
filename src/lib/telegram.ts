import fs from 'fs/promises';
import path from 'path';

// Load config from JSON if exists, otherwise env
async function getTelegramConfig() {
    try {
        const configFile = path.join(process.cwd(), 'src/data/telegram.json');
        const fileContent = await fs.readFile(configFile, 'utf-8');
        const config = JSON.parse(fileContent);
        if (config.botToken && config.chatId) {
            return { botToken: config.botToken, chatId: config.chatId, isCustom: true };
        }
    } catch (e) {
        // Ignore file read errors, fallback to env
    }

    return {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
        isCustom: false
    };
}

export async function sendTelegramAlert(message: string, options?: { buttons?: { text: string; url: string }[][] }): Promise<void> {
    const config = await getTelegramConfig();
    const { botToken, chatId } = config;

    if (!botToken || !chatId) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[Telegram] Config missing, skipping alert:', message);
        }
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const body: any = {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
        };

        if (options?.buttons) {
            body.reply_markup = {
                inline_keyboard: options.buttons
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Telegram] Failed to send alert:', errorText);
        }
    } catch (error) {
        console.error('[Telegram] Network error sending alert:', error);
    }
}

export async function sendTelegramDocument(fileName: string, buffer: Buffer, caption?: string): Promise<void> {
    const config = await getTelegramConfig();
    const { botToken, chatId } = config;

    if (!botToken || !chatId) return;

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendDocument`;

        const formData = new FormData();
        formData.append('chat_id', chatId);

        // Convert Buffer to File-like blob for fetch FormData
        const blob = new Blob([new Uint8Array(buffer)], { type: 'application/pdf' });
        formData.append('document', blob, fileName);

        if (caption) formData.append('caption', caption);
        formData.append('parse_mode', 'Markdown');

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Telegram] Failed to send document:', errorText);
        }
    } catch (error) {
        console.error('[Telegram] Network error sending document:', error);
    }
}

export { getTelegramConfig };
