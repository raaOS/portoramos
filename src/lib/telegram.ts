const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramAlert(message: string): Promise<void> {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        // Fail silently in development/production if not configured,
        // to prevent blocking the main application flow.
        // In dev, we might want to log a warning.
        if (process.env.NODE_ENV === 'development') {
            console.log('[Telegram] Config missing, skipping alert:', message);
        }
        return;
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
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
