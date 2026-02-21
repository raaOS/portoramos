import 'server-only';
import { db } from './firebaseAdmin';
import * as crypto from 'crypto';

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
    telegramThreadId?: number;  // The forum topic ID (message_thread_id)
    lastActive: number;
    aiMode: boolean;
    lastAdminReplyTime: number;
}

// In Phase 4, we use Firebase instead of local maps.
// Firebase structure:
// /sessions/{visitorId}: ChatSession
// /messages/{visitorId}: Record<string, ChatMessage>

export const chatStore = {
    async getSession(visitorId: string): Promise<ChatSession | null> {
        const snap = await db.ref(`sessions/${visitorId}`).once('value');
        if (!snap.exists()) return null;
        return snap.val() as ChatSession;
    },

    async createOrUpdateSession(visitorId: string): Promise<ChatSession> {
        let session = await this.getSession(visitorId);
        const now = Date.now();
        if (!session) {
            session = {
                visitorId,
                lastActive: now,
                aiMode: true,
                lastAdminReplyTime: 0
            };
        } else {
            session.lastActive = now;
        }
        await db.ref(`sessions/${visitorId}`).update(session);
        return session;
    },

    async addVisitorMessage(visitorId: string, text: string, telegramMsgId?: number): Promise<ChatMessage> {
        await this.createOrUpdateSession(visitorId);

        const msgId = crypto.randomUUID();
        const msg: ChatMessage = {
            id: msgId,
            text,
            sender: 'visitor',
            timestamp: Date.now()
        };

        // Push message
        await db.ref(`messages/${visitorId}/${msgId}`).set(msg);

        // Update session tracking
        if (telegramMsgId) {
            await db.ref(`sessions/${visitorId}`).update({ telegramMessageId: telegramMsgId });
            await db.ref(`messageMap/${telegramMsgId}`).set(visitorId);
        }

        return msg;
    },

    async updateSessionThreadId(visitorId: string, threadId: number) {
        await db.ref(`sessions/${visitorId}`).update({ telegramThreadId: threadId });
        // Also map threadId to visitorId for fast webhook routing
        await db.ref(`threadMap/${threadId}`).set(visitorId);
    },

    async getVisitorByThreadId(threadId: number): Promise<string | null> {
        const snap = await db.ref(`threadMap/${threadId}`).once('value');
        if (!snap.exists()) return null;
        return snap.val();
    },

    async getVisitorByMessageId(msgId: number): Promise<string | null> {
        const snap = await db.ref(`messageMap/${msgId}`).once('value');
        if (!snap.exists()) return null;
        return snap.val();
    },

    async addAdminReply(visitorId: string, text: string): Promise<boolean> {
        const session = await this.getSession(visitorId);
        if (!session) return false;

        const msgId = crypto.randomUUID();
        await db.ref(`messages/${visitorId}/${msgId}`).set({
            id: msgId,
            text,
            sender: 'admin',
            timestamp: Date.now()
        });

        await db.ref(`sessions/${visitorId}`).update({
            lastActive: Date.now(),
            lastAdminReplyTime: Date.now(),
            aiMode: false // Admin Takes over forever until /ai is called again
        });

        return true;
    },

    async setAiMode(visitorId: string, enabled: boolean): Promise<boolean> {
        const session = await this.getSession(visitorId);
        if (!session) return false;
        await db.ref(`sessions/${visitorId}`).update({ aiMode: enabled });
        return true;
    },

    async addAiReply(visitorId: string, text: string): Promise<ChatMessage | null> {
        const session = await this.getSession(visitorId);
        if (!session) return null;

        const msgId = crypto.randomUUID();
        const msg: ChatMessage = {
            id: msgId,
            text,
            sender: 'admin',
            timestamp: Date.now()
        };

        await db.ref(`messages/${visitorId}/${msgId}`).set(msg);
        await db.ref(`sessions/${visitorId}`).update({ lastActive: Date.now() });
        return msg;
    },

    async getAllMessages(visitorId: string): Promise<ChatMessage[]> {
        const snap = await db.ref(`messages/${visitorId}`).once('value');
        if (!snap.exists()) return [];
        const messagesMap = snap.val();
        // Convert object to sorted array
        return Object.values(messagesMap)
            .sort((a: any, b: any) => a.timestamp - b.timestamp) as ChatMessage[];
    }
};
