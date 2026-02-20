// In-memory store to hold recent chat messages and active sessions
// Note: In a Serverless environment like Vercel, in-memory state is NOT shared across instances
// and will frequently be reset. However, for a simple portfolio contact feature with low traffic,
// it is often sufficient for short-lived real-time sync.

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'visitor' | 'admin';
    timestamp: number;
    delivered?: boolean;
}

export interface ChatSession {
    visitorId: string;
    telegramMessageId?: number; // The message ID in telegram to reply to
    messages: ChatMessage[];
    lastActive: number;
}

// Map visitorId -> ChatSession
const activeSessions = new Map<string, ChatSession>();

// Map Telegram Message ID -> visitorId (to route replies back)
const telegramMessageMap = new Map<number, string>();

const MAX_SESSIONS = 100;
const SESSION_TIMEOUT = 1000 * 60 * 60; // 1 hour

export const chatStore = {
    getSession(visitorId: string): ChatSession | undefined {
        return activeSessions.get(visitorId);
    },

    createOrUpdateSession(visitorId: string): ChatSession {
        let session = activeSessions.get(visitorId);
        if (!session) {
            // Cleanup old sessions before adding new one
            if (activeSessions.size >= MAX_SESSIONS) {
                this.cleanup();
            }
            session = {
                visitorId,
                messages: [],
                lastActive: Date.now()
            };
            activeSessions.set(visitorId, session);
        } else {
            session.lastActive = Date.now();
        }
        return session;
    },

    addVisitorMessage(visitorId: string, text: string, telegramMsgId?: number): ChatMessage {
        const session = this.createOrUpdateSession(visitorId);
        const msg: ChatMessage = {
            id: crypto.randomUUID(),
            text,
            sender: 'visitor',
            timestamp: Date.now()
        };
        session.messages.push(msg);

        if (telegramMsgId) {
            session.telegramMessageId = telegramMsgId;
            telegramMessageMap.set(telegramMsgId, visitorId);
        }

        return msg;
    },

    addAdminReply(replyToTelegramId: number, text: string): boolean {
        // Find which visitor this reply belongs to
        const visitorId = telegramMessageMap.get(replyToTelegramId);
        if (!visitorId) return false;

        const session = activeSessions.get(visitorId);
        if (!session) return false;

        session.messages.push({
            id: crypto.randomUUID(),
            text,
            sender: 'admin',
            timestamp: Date.now()
        });
        session.lastActive = Date.now();
        return true;
    },

    // Gets all messages since a specific timestamp (for polling)
    getMessagesSince(visitorId: string, since: number): ChatMessage[] {
        const session = activeSessions.get(visitorId);
        if (!session) return [];

        session.lastActive = Date.now();
        return session.messages.filter(m => m.timestamp > since);
    },

    // Gets all messages for a session (initial load)
    getAllMessages(visitorId: string): ChatMessage[] {
        const session = activeSessions.get(visitorId);
        if (!session) return [];
        return session.messages;
    },

    cleanup() {
        const now = Date.now();
        for (const [visitorId, session] of activeSessions.entries()) {
            if (now - session.lastActive > SESSION_TIMEOUT) {
                // Delete associated telegram mappings
                for (const [msgId, vId] of telegramMessageMap.entries()) {
                    if (vId === visitorId) {
                        telegramMessageMap.delete(msgId);
                    }
                }
                activeSessions.delete(visitorId);
            }
        }
    }
};
