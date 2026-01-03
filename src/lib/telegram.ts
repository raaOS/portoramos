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

export async function sendTelegramAlert(message: string): Promise<void> {
    const { botToken, chatId } = await getTelegramConfig();

    if (!botToken || !chatId) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[Telegram] Config missing, skipping alert:', message);
        }
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Telegram] Failed to send alert:', errorText);
        }
    } catch (error) {
        console.error('[Telegram] Network error sending alert:', error);
    }
}

export { getTelegramConfig };
