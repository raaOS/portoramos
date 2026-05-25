/**
 * Type definitions for Telegram Webhook
 */

export interface InlineKeyboardMarkup {
  inline_keyboard: { text: string; url?: string }[][];
}

/**
 * Telegram ForceReply markup. Memunculkan reply UI di client supaya user
 * langsung diminta membalas pesan ini. Dipakai untuk conversational flow
 * (mis. /apply tanpa argumen → bot prompt link → user reply dengan link).
 *
 * Spec: https://core.telegram.org/bots/api#forcereply
 */
export interface ForceReplyMarkup {
  force_reply: true;
  /** Hanya target user yang di-mention atau pengirim pesan original. */
  selective?: boolean;
  /** Hint text di input field client (max 64 char). */
  input_field_placeholder?: string;
}

export type ReplyMarkup = InlineKeyboardMarkup | ForceReplyMarkup;

export interface MessageToSend {
  text: string;
  reply_markup?: ReplyMarkup;
  message_thread_id?: number;
}

export interface WebhookContext {
  incomingChatId: string;
  text: string;
  threadId?: number;
  botToken: string;
  adminChatId: string;
  groupId?: string | null;
  currentVisitorId: string | null;
  isAdmin: boolean;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  groupId?: string | null;
}

// Minimal chat store interface for handlers
export interface ChatStoreInterface {
  setAiMode: (visitorId: string, enabled: boolean) => Promise<boolean>;
  getAllMessages: (visitorId: string) => Promise<Array<{ sender: string; text: string }>>;
  addAiReply: (visitorId: string, response: string) => Promise<unknown>;
  addAdminReply: (visitorId: string, text: string) => Promise<boolean>;
  setTypingStatus: (visitorId: string, durationMs: number) => Promise<void>;
  getTypingStatus: (visitorId: string) => Promise<boolean>;
}

// Simple message format for AI processing
export interface SimpleMessage {
  sender: string;
  text: string;
}
