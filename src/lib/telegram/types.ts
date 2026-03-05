/**
 * Type definitions for Telegram Webhook
 */

export interface ReplyMarkup {
    inline_keyboard: { text: string; url?: string }[][];
}

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
    getAllMessages: (visitorId: string) => Promise<Array<{ sender: string; content: string }>>;
    addAiReply: (visitorId: string, response: string) => Promise<void>;
    addAdminReply: (visitorId: string, text: string) => Promise<boolean>;
}

// Simple message format for AI processing
export interface SimpleMessage {
    sender: string;
    content: string;
}
