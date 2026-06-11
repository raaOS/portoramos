/**
 * Telegram Service - Security Hardened
 *
 * SECURITY NOTES:
 * - Token DIWAJIBKAN dari environment variable (TELEGRAM_BOT_TOKEN)
 * - Chat ID DIWAJIBKAN dari environment variable (TELEGRAM_CHAT_ID)
 * - File telegram.json hanya untuk dokumentasi, tidak dibaca untuk auth
 * - Never log full token - only show first/last 5 chars for debugging
 */

import { cleanEnvVar } from '@/lib/utils/env';
import crypto from 'crypto';

// Helper to mask token for logging (security)
const maskToken = (token: string): string => {
  if (token.length <= 10) return '***';
  return `${token.slice(0, 5)}...${token.slice(-5)}`;
};

// Get Telegram config from environment only
function getTelegramConfigFromEnv() {
  const botToken = cleanEnvVar('TELEGRAM_BOT_TOKEN');
  const chatId = cleanEnvVar('TELEGRAM_CHAT_ID');
  const groupId = cleanEnvVar('TELEGRAM_GROUP_ID');

  return { botToken, chatId, groupId };
}

// Validate config and return safe error message
function validateConfig():
  | { valid: true; config: { botToken: string; chatId: string; groupId?: string } }
  | { valid: false; error: string } {
  const { botToken, chatId, groupId } = getTelegramConfigFromEnv();

  if (!botToken) {
    return {
      valid: false,
      error: 'Telegram Bot Token tidak dikonfigurasi. Tambahkan TELEGRAM_BOT_TOKEN di .env.local',
    };
  }

  if (!chatId) {
    return {
      valid: false,
      error: 'Telegram Chat ID tidak dikonfigurasi. Tambahkan TELEGRAM_CHAT_ID di .env.local',
    };
  }

  // Validate token format (should be digits:alphanumeric)
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) {
    return {
      valid: false,
      error:
        'Format TELEGRAM_BOT_TOKEN tidak valid. Pastikan format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
    };
  }

  return { valid: true, config: { botToken, chatId, groupId: groupId || undefined } };
}

export function buildTelegramWebhookSecret(botToken: string): string {
  return crypto.createHash('sha256').update(`telegram-webhook:${botToken}`).digest('hex');
}

export function isValidTelegramWebhookSecret(
  botToken: string,
  providedSecret?: string | null
): boolean {
  if (!providedSecret) {
    return false;
  }

  const expectedSecret = buildTelegramWebhookSecret(botToken);
  const providedBuffer = Buffer.from(providedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Telegram Message Body interface (shared by text message functions)
 */
interface TelegramMessageBody {
  chat_id: string;
  text: string;
  parse_mode: 'Markdown' | 'HTML';
  message_thread_id?: number;
  reply_markup?: {
    inline_keyboard: { text: string; url?: string; callback_data?: string }[][];
  };
}

/**
 * Internal shared function for sending Telegram text messages.
 * Used by both sendTelegramAlert and sendTelegramToGroup.
 */
async function sendTelegramMessage(
  chatId: string,
  botToken: string,
  message: string,
  options?: {
    buttons?: { text: string; url?: string; callback_data?: string }[][];
    messageThreadId?: number;
  },
  label = 'Telegram'
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const body: TelegramMessageBody = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    };

    if (options?.buttons) {
      body.reply_markup = {
        inline_keyboard: options.buttons,
      };
    }

    if (typeof options?.messageThreadId === 'number' && Number.isFinite(options.messageThreadId)) {
      body.message_thread_id = options.messageThreadId;
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
      console.error(`[${label}] API error:`, errorMsg);
      return { success: false, error: 'Failed to send message' };
    }

    return { success: true };
  } catch (error) {
    console.error(`[${label}] Network error:`, error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Send Telegram Alert with Markdown formatting
 */
export async function sendTelegramAlert(
  message: string,
  options?: {
    buttons?: { text: string; url?: string; callback_data?: string }[][];
    priority?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const validation = validateConfig();

  if (!validation.valid) {
    console.error('[Telegram] Config error:', validation.error);
    return { success: false, error: 'Service not configured' };
  }

  const { botToken, chatId } = validation.config;
  return sendTelegramMessage(chatId, botToken, message, options, 'Telegram');
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
      error: validation.error,
    };
  }

  const { botToken, chatId, groupId } = validation.config;

  return {
    configured: true as const,
    botToken: maskToken(botToken),
    chatId,
    groupId,
  };
}

export async function getTelegramConfigInternal() {
  const validation = validateConfig();
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return validation.config;
}

/**
 * Send Telegram Alert to Group (if TELEGRAM_GROUP_ID is configured)
 * This is a wrapper that sends to the group instead of personal chat
 */
export async function sendTelegramToGroup(
  message: string,
  options?: {
    buttons?: { text: string; url: string }[][];
    priority?: string;
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

  return sendTelegramMessage(groupId, botToken, message, options, 'Telegram Group');
}

// Re-export untuk backward compatibility
export { getTelegramConfigSafe as getTelegramConfig };

// Export internal untuk webhook use only
export { validateConfig };

/**
 * Send Feedback notification ke Telegram.
 *
 * Routing priority (fallback chain):
 *  1. Grup + topic (TELEGRAM_GROUP_ID + TELEGRAM_FEEDBACK_THREAD_ID)  → preferred
 *  2. Grup saja (TELEGRAM_GROUP_ID)                                    → bila thread belum di-setup
 *  3. Personal chat (TELEGRAM_CHAT_ID)                                 → fallback terakhir
 *
 * Ini memastikan notif selalu sampai, tanpa memaksa user set topic ID sebelum
 * bisa pakai fitur.
 */
export async function sendFeedbackNotification(
  message: string,
  options?: { buttons?: { text: string; url: string }[][] }
): Promise<{ success: boolean; error?: string; target: 'topic' | 'group' | 'personal' | 'none' }> {
  const validation = validateConfig();
  if (!validation.valid) {
    console.error('[Feedback Telegram] Config error:', validation.error);
    return { success: false, error: 'Service not configured', target: 'none' };
  }

  const { botToken, chatId, groupId } = validation.config;
  const rawThreadId = cleanEnvVar('TELEGRAM_FEEDBACK_THREAD_ID');
  const parsedThreadId = rawThreadId ? Number.parseInt(rawThreadId, 10) : NaN;
  const threadId = Number.isFinite(parsedThreadId) ? parsedThreadId : null;

  // Dev-only diagnostic: konfirmasi routing path yang dipakai.
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Feedback Telegram] Routing diagnostic:', {
      hasGroupId: Boolean(groupId),
      rawThreadIdRaw: rawThreadId || '(empty)',
      parsedThreadId: threadId,
      willUseRoute: groupId && threadId !== null ? 'topic' : groupId ? 'group' : 'personal',
    });
  }

  // 1. Grup + topic
  if (groupId && threadId !== null) {
    const result = await sendTelegramMessage(
      groupId,
      botToken,
      message,
      { buttons: options?.buttons, messageThreadId: threadId },
      'Telegram Feedback Topic'
    );
    if (result.success) return { ...result, target: 'topic' };
    console.warn('[Feedback Telegram] Topic send failed, falling back to group');
  }

  // 2. Grup saja
  if (groupId) {
    const result = await sendTelegramMessage(
      groupId,
      botToken,
      message,
      { buttons: options?.buttons },
      'Telegram Feedback Group'
    );
    if (result.success) return { ...result, target: 'group' };
    console.warn('[Feedback Telegram] Group send failed, falling back to personal');
  }

  // 3. Personal chat fallback
  const result = await sendTelegramMessage(
    chatId,
    botToken,
    message,
    { buttons: options?.buttons },
    'Telegram Feedback Personal'
  );
  return { ...result, target: result.success ? 'personal' : 'none' };
}

export interface SecurityAlertParams {
  title: string;
  ip: string;
  device: string;
  description?: string;
  network?: string;
  location?: string;
  extraInfo?: string;
  buttons?: { text: string; url?: string; callback_data?: string }[][];
  sendToGroup?: boolean;
}

/**
 * Send structured Security Alert to Telegram.
 * Unifies formatting across login rate limit, failure, success, password change, and OTP requests.
 */
export async function sendSecurityAlert(
  params: SecurityAlertParams
): Promise<{ success: boolean; error?: string }> {
  const lines = [params.title, ''];

  if (params.description) {
    lines.push(params.description, '');
  }

  lines.push(`💻 **Device:** ${params.device}`);
  
  if (params.network) {
    lines.push(`🌐 **Network:** ${params.network}`);
  }

  lines.push(`📡 **IP:** \`${params.ip}\``);

  if (params.location) {
    if (params.location.includes('📍') || params.location.includes('•')) {
      lines.push(params.location);
    } else {
      lines.push(`📍 **Location:** ${params.location}`);
    }
  }

  if (params.extraInfo) {
    lines.push(params.extraInfo);
  }

  lines.push('', `🕒 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);

  const message = lines.join('\n').trim();

  // Send to personal alert chat
  const personalRes = await sendTelegramAlert(message, {
    priority: 'high',
    buttons: params.buttons,
  });

  // Also send to group if requested
  if (params.sendToGroup) {
    await sendTelegramToGroup(message, {
      priority: 'high',
      buttons: params.buttons as { text: string; url: string }[][],
    }).catch((err) => {
      console.error('[Telegram] Failed to send security alert to group:', err);
    });
  }

  return personalRes;
}
