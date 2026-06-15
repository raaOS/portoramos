/**
 * Telegram Message Sender Utilities
 *
 * This module handles the actual HTTP requests to the Telegram Bot API.
 */

import type { ReplyMarkup } from './types';

interface TelegramSendMessageBody {
  chat_id: string;
  text: string;
  parse_mode: 'Markdown' | 'HTML' | 'MarkdownV2';
  message_thread_id?: number;
  reply_markup?: ReplyMarkup;
}

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

  const body: TelegramSendMessageBody = {
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

  const body: TelegramSendMessageBody = {
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

/**
 * Answer a callback query to remove the loading state on the button
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  botToken: string,
  options?: { text?: string; showAlert?: boolean }
) {
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
  const body: Record<string, unknown> = {
    callback_query_id: callbackQueryId,
  };
  if (options?.text) body.text = options.text;
  if (options?.showAlert) body.show_alert = options.showAlert;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[Telegram Sender] answerCallbackQuery error:', error.description);
    }
    return response;
  } catch (error) {
    console.error('[Telegram Sender] Network error:', error);
    throw error;
  }
}

/**
 * Edit message text (useful for removing buttons after click)
 */
export async function editMessageText(
  chatId: string,
  messageId: number,
  text: string,
  botToken: string,
  options?: { replyMarkup?: ReplyMarkup }
) {
  const url = `https://api.telegram.org/bot${botToken}/editMessageText`;
  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'Markdown',
  };
  if (options?.replyMarkup) {
    body.reply_markup = options.replyMarkup;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[Telegram Sender] editMessageText error:', error.description);
    }
    return response;
  } catch (error) {
    console.error('[Telegram Sender] Network error:', error);
    throw error;
  }
}
