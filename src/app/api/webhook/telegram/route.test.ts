import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  answerCallbackQuery: vi.fn(),
  editMessageText: vi.fn(),
}));

vi.mock('@/lib/database', () => ({
  db: {
    ref: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  hashPasswordScrypt: vi.fn(() => 'hashed-otp'),
}));

vi.mock('@/lib/chatStore', () => ({
  chatStore: {
    getVisitorByThreadId: vi.fn(),
    getVisitorByMessageId: vi.fn(),
  },
}));

vi.mock('@/lib/telegram/handlers', () => ({
  handleAiCommand: vi.fn(),
  handleAdminReply: vi.fn(),
  handleGuestMessage: vi.fn(() => []),
}));

import { POST } from './route';
import {
  getTelegramConfigSafe,
  isValidTelegramWebhookSecret,
  validateConfig,
} from '@/lib/telegram';
import { db } from '@/lib/database';
import { hashPasswordScrypt } from '@/lib/auth';
import { checkIsAdmin } from '@/lib/telegram/helpers';
import { answerCallbackQuery, editMessageText, sendMessage } from '@/lib/telegram/sender';
import { handleAiCommand } from '@/lib/telegram/handlers';

describe('POST /api/webhook/telegram', () => {
  const originalPasswordSalt = process.env.PASSWORD_SALT;
  const originalJobBotThreadId = process.env.JOB_BOT_THREAD_ID;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.PASSWORD_SALT = 'test-salt';
    delete process.env.JOB_BOT_THREAD_ID;

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
      },
    });
  });

  afterEach(() => {
    if (typeof originalPasswordSalt === 'string') {
      process.env.PASSWORD_SALT = originalPasswordSalt;
    } else {
      delete process.env.PASSWORD_SALT;
    }

    if (typeof originalJobBotThreadId === 'string') {
      process.env.JOB_BOT_THREAD_ID = originalJobBotThreadId;
    } else {
      delete process.env.JOB_BOT_THREAD_ID;
    }
  });

  it('rejects webhook requests with an invalid secret token before processing messages', async () => {
    vi.mocked(isValidTelegramWebhookSecret).mockReturnValue(false);

    const response = await POST(
      new Request('http://localhost/api/webhook/telegram', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: { text: '/ai', chat: { id: 1 } } }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized webhook request' });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON after the secret is verified', async () => {
    vi.mocked(isValidTelegramWebhookSecret).mockReturnValue(true);

    const response = await POST(
      new Request('http://localhost/api/webhook/telegram', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'valid-secret',
        },
        body: '{invalid-json',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid JSON' });
  });

  it('keeps main bot command surface limited to /ai', async () => {
    vi.mocked(isValidTelegramWebhookSecret).mockReturnValue(true);
    vi.mocked(checkIsAdmin).mockReturnValue(true);

    const response = await POST(
      new Request('http://localhost/api/webhook/telegram', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'valid-secret',
        },
        body: JSON.stringify({
          message: {
            text: '/scan',
            chat: { id: 'admin-chat', type: 'supergroup' },
          },
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(handleAiCommand).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('handles /ai as the only main bot admin command', async () => {
    vi.mocked(isValidTelegramWebhookSecret).mockReturnValue(true);
    vi.mocked(checkIsAdmin).mockReturnValue(true);
    vi.mocked(handleAiCommand).mockResolvedValue([{ text: 'AI mode updated' }]);

    const response = await POST(
      new Request('http://localhost/api/webhook/telegram', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'valid-secret',
        },
        body: JSON.stringify({
          message: {
            text: '/ai',
            chat: { id: 'admin-chat', type: 'supergroup' },
            message_thread_id: 123,
          },
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(handleAiCommand).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledWith(
      'admin-chat',
      'AI mode updated',
      'telegram-bot-token',
      expect.objectContaining({ threadId: 123 })
    );
  });

  it('approves only the matching OTP request session', async () => {
    vi.mocked(isValidTelegramWebhookSecret).mockReturnValue(true);
    vi.mocked(checkIsAdmin).mockReturnValue(true);

    const dbRef = {
      once: vi.fn().mockResolvedValue({
        val: () => ({
          status: 'pending',
          purpose: 'pin',
          requestId: 'request-123',
          expiresAt: Date.now() + 60_000,
        }),
      }),
      set: vi.fn(),
      remove: vi.fn(),
    };
    vi.mocked(db.ref).mockReturnValue(dbRef as never);

    const response = await POST(
      new Request('http://localhost/api/webhook/telegram', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'valid-secret',
        },
        body: JSON.stringify({
          callback_query: {
            id: 'callback-1',
            data: 'otp_approve:pin:request-123',
            message: {
              message_id: 42,
              chat: { id: 'admin-chat' },
            },
          },
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(db.ref).toHaveBeenCalledWith('settings/adminPinOtp');
    expect(hashPasswordScrypt).toHaveBeenCalledWith(expect.stringMatching(/^\d{6}$/), 'test-salt');
    expect(dbRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'approved',
        purpose: 'pin',
        requestId: 'request-123',
        codeHash: 'hashed-otp',
      })
    );
    expect(editMessageText).toHaveBeenCalled();
    expect(editMessageText).toHaveBeenCalledWith(
      'admin-chat',
      42,
      expect.stringContaining('OTP UBAH PIN DISETUJUI'),
      'telegram-bot-token'
    );
    expect(answerCallbackQuery).toHaveBeenCalledWith(
      'callback-1',
      'telegram-bot-token',
      expect.objectContaining({ text: 'OTP PIN disetujui' })
    );
  });

  it('ignores stale OTP callback sessions from Telegram pending updates', async () => {
    vi.mocked(isValidTelegramWebhookSecret).mockReturnValue(true);
    vi.mocked(checkIsAdmin).mockReturnValue(true);

    const dbRef = {
      once: vi.fn().mockResolvedValue({
        val: () => ({
          status: 'pending',
          requestId: 'current-request',
          expiresAt: Date.now() + 60_000,
        }),
      }),
      set: vi.fn(),
      remove: vi.fn(),
    };
    vi.mocked(db.ref).mockReturnValue(dbRef as never);

    const response = await POST(
      new Request('http://localhost/api/webhook/telegram', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-telegram-bot-api-secret-token': 'valid-secret',
        },
        body: JSON.stringify({
          callback_query: {
            id: 'callback-old',
            data: 'otp_approve:old-request',
            message: {
              message_id: 43,
              chat: { id: 'admin-chat' },
            },
          },
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(dbRef.set).not.toHaveBeenCalled();
    expect(answerCallbackQuery).toHaveBeenCalledWith(
      'callback-old',
      'telegram-bot-token',
      expect.objectContaining({ showAlert: true })
    );
  });
});
