/**
 * Telegram Service - Security Hardened
 * 
 * SECURITY NOTES:
 * - Token DIWAJIBKAN dari environment variable (TELEGRAM_BOT_TOKEN)
 * - Chat ID DIWAJIBKAN dari environment variable (TELEGRAM_CHAT_ID)
 * - File telegram.json hanya untuk dokumentasi, tidak dibaca untuk auth
 * - Never log full token - only show first/last 5 chars for debugging
 */

// Helper to clean environment variables (removes quotes and trims)
const cleanEnvVar = (name: string): string | undefined => {
    let val = process.env[name];
    if (!val) return undefined;
    val = val.trim();
    // Remove surrounding quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
    }
    return val;
};

// Helper to mask token for logging (security)
const maskToken = (token: string): string => {
    if (token.length <= 10) return '***';
    return `${token.slice(0, 5)}...${token.slice(-5)}`;
};

// Get Telegram config from environment only
function getTelegramConfig() {
    const botToken = cleanEnvVar('TELEGRAM_BOT_TOKEN');
    const chatId = cleanEnvVar('TELEGRAM_CHAT_ID');
    const groupId = cleanEnvVar('TELEGRAM_GROUP_ID');

    return { botToken, chatId, groupId };
}

// Validate config and return safe error message
function validateConfig(): { valid: true; config: { botToken: string; chatId: string; groupId?: string } } | { valid: false; error: string } {
    const { botToken, chatId, groupId } = getTelegramConfig();

    if (!botToken) {
        return { 
            valid: false, 
            error: 'Telegram Bot Token tidak dikonfigurasi. Tambahkan TELEGRAM_BOT_TOKEN di .env.local' 
        };
    }

    if (!chatId) {
        return { 
            valid: false, 
            error: 'Telegram Chat ID tidak dikonfigurasi. Tambahkan TELEGRAM_CHAT_ID di .env.local' 
        };
    }

    // Validate token format (should be digits:alphanumeric)
    if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) {
        return { 
            valid: false, 
            error: 'Format TELEGRAM_BOT_TOKEN tidak valid. Pastikan format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz' 
        };
    }

    return { valid: true, config: { botToken, chatId, groupId: groupId || undefined } };
}

/**
 * Send Telegram Alert with Markdown formatting
 */
export async function sendTelegramAlert(
    message: string, 
    options?: { 
        buttons?: { text: string; url: string }[][], 
        priority?: string 
    }
): Promise<{ success: boolean; error?: string }> {
    const validation = validateConfig();
    
    if (!validation.valid) {
        console.error('[Telegram] Config error:', validation.error);
        return { success: false, error: 'Service not configured' };
    }

    const { botToken, chatId } = validation.config;

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        interface TelegramMessageBody {
            chat_id: string;
            text: string;
            parse_mode: 'Markdown' | 'HTML';
            reply_markup?: {
                inline_keyboard: { text: string; url: string }[][];
            };
        }

        const body: TelegramMessageBody = {
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
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.description || `HTTP ${response.status}`;
            console.error('[Telegram] API error:', errorMsg);
            return { success: false, error: 'Failed to send message' };
        }

        return { success: true };
    } catch (error) {
        console.error('[Telegram] Network error:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Send Document/PDF via Telegram
 */
export async function sendTelegramDocument(
    fileName: string, 
    buffer: Buffer, 
    caption?: string
): Promise<{ success: boolean; error?: string }> {
    const validation = validateConfig();
    
    if (!validation.valid) {
        console.error('[Telegram] Config error:', validation.error);
        return { success: false, error: 'Service not configured' };
    }

    const { botToken, chatId } = validation.config;

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
            const errorData = await response.json().catch(() => ({}));
            console.error('[Telegram] Document send error:', errorData.description);
            return { success: false, error: 'Failed to send document' };
        }

        return { success: true };
    } catch (error) {
        console.error('[Telegram] Network error sending document:', error);
        return { success: false, error: 'Network error' };
    }
}

/**
 * Get sanitized config for webhook (returns safe-to-log info)
 */
export async function getTelegramConfigSafe() {
    const validation = validateConfig();
    
    if (!validation.valid) {
        return { 
            configured: false as const, 
            error: validation.error 
        };
    }

    const { botToken, chatId, groupId } = validation.config;
    
    return {
        configured: true as const,
        botToken: maskToken(botToken),
        chatId,
        groupId,
        // Full token hanya untuk internal use di webhook
        _botToken: botToken
    };
}

/**
 * Send Telegram Alert to Group (if TELEGRAM_GROUP_ID is configured)
 * This is a wrapper that sends to the group instead of personal chat
 */
export async function sendTelegramToGroup(
    message: string, 
    options?: { 
        buttons?: { text: string; url: string }[][], 
        priority?: string 
    }
): Promise<{ success: boolean; error?: string }> {
    const validation = validateConfig();
    
    if (!validation.valid) {
        console.error('[Telegram] Config error:', validation.error);
        return { success: false, error: 'Service not configured' };
    }

    const { botToken, groupId } = validation.config;

    // If no group ID configured, silently skip
    if (!groupId) {
        return { success: true };
    }

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        interface TelegramMessageBody {
            chat_id: string;
            text: string;
            parse_mode: 'Markdown' | 'HTML';
            reply_markup?: {
                inline_keyboard: { text: string; url: string }[][];
            };
        }

        const body: TelegramMessageBody = {
            chat_id: groupId,
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
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.description || `HTTP ${response.status}`;
            console.error('[Telegram Group] API error:', errorMsg);
            return { success: false, error: 'Failed to send message to group' };
        }

        return { success: true };
    } catch (error) {
        console.error('[Telegram Group] Network error:', error);
        return { success: false, error: 'Network error' };
    }
}

// Re-export untuk backward compatibility
export { getTelegramConfigSafe as getTelegramConfig };

// Export internal untuk webhook use only
export { validateConfig };
