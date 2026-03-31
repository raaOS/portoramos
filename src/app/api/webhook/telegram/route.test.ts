import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/telegram', () => ({
    getTelegramConfigSafe: vi.fn(),
    isValidTelegramWebhookSecret: vi.fn(),
    validateConfig: vi.fn(),
}));

vi.mock('@/lib/telegram/rateLimiter', () => ({
    checkRateLimit: vi.fn(() => ({ allowed: true })),
}));

vi.mock('@/lib/telegram/validators', () => ({
    validateWebhookData: vi.fn(() => ({ valid: true })),
}));

vi.mock('@/lib/telegram/helpers', () => ({
    checkIsAdmin: vi.fn(() => false),
    logWebhookDebug: vi.fn(),
}));

vi.mock('@/lib/telegram/sender', () => ({
    sendImmediate: vi.fn(),
    sendMessage: vi.fn(),
}));

vi.mock('@/lib/chatStore', () => ({
    chatStore: {
        getVisitorByThreadId: vi.fn(),
        getVisitorByMessageId: vi.fn(),
    }
}));

vi.mock('@/lib/telegram/handlers', () => ({
    handleLeadsCommand: vi.fn(),
    handleProposalCommand: vi.fn(),
    handleResumeCommand: vi.fn(),
    handleAiCommand: vi.fn(),
    handleAdminReply: vi.fn(),
    handleGuestMessage: vi.fn(() => []),
    handleHelpCommand: vi.fn(() => []),
}));

import { POST } from './route';
import {
    getTelegramConfigSafe,
    isValidTelegramWebhookSecret,
    validateConfig
} from '@/lib/telegram';
import { sendMessage } from '@/lib/telegram/sender';

describe('POST /api/webhook/telegram', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        vi.mocked(getTelegramConfigSafe).mockResolvedValue({
            configured: true,
            botToken: '12345...token',
            chatId: 'admin-chat',
            groupId: undefined,
        });

        vi.mocked(validateConfig).mockReturnValue({
            valid: true,
            config: {
                botToken: 'telegram-bot-token',
                chatId: 'admin-chat',
                groupId: undefined,
            }
        });
    });

    it('rejects webhook requests with an invalid secret token before processing messages', async () => {
        vi.mocked(isValidTelegramWebhookSecret).mockReturnValue(false);

        const response = await POST(new Request('http://localhost/api/webhook/telegram', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ message: { text: '/help', chat: { id: 1 } } })
        }));
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body).toEqual({ error: 'Unauthorized webhook request' });
        expect(sendMessage).not.toHaveBeenCalled();
    });

    it('returns 400 for malformed JSON after the secret is verified', async () => {
        vi.mocked(isValidTelegramWebhookSecret).mockReturnValue(true);

        const response = await POST(new Request('http://localhost/api/webhook/telegram', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-telegram-bot-api-secret-token': 'valid-secret'
            },
            body: '{invalid-json'
        }));
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ error: 'Invalid JSON' });
    });
});
