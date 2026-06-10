import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  validateConfig: vi.fn(),
  checkDataRateLimit: vi.fn(),
  addVisitorMessage: vi.fn(),
  getSession: vi.fn(),
  createOrUpdateSession: vi.fn(),
  updateSessionThreadId: vi.fn(),
  mapTelegramMessage: vi.fn(),
  getAllMessages: vi.fn(),
  addAiReply: vi.fn(),
  setTypingStatus: vi.fn(),
  generateResponse: vi.fn(),
}));

vi.mock('@/lib/telegram', () => ({
  validateConfig: mocks.validateConfig,
}));

vi.mock('@/lib/dataRateLimit', () => ({
  checkDataRateLimit: mocks.checkDataRateLimit,
}));

vi.mock('@/lib/chatStore', () => ({
  chatStore: {
    addVisitorMessage: mocks.addVisitorMessage,
    getSession: mocks.getSession,
    createOrUpdateSession: mocks.createOrUpdateSession,
    updateSessionThreadId: mocks.updateSessionThreadId,
    mapTelegramMessage: mocks.mapTelegramMessage,
    getAllMessages: mocks.getAllMessages,
    addAiReply: mocks.addAiReply,
    setTypingStatus: mocks.setTypingStatus,
  },
}));

vi.mock('@/lib/services/aiChatService', () => ({
  aiChatService: {
    generateResponse: mocks.generateResponse,
  },
}));

import { POST } from './route';

function mockTelegramResponse(ok: boolean, result: Record<string, unknown> = {}) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve({ ok, result }),
  });
}

describe('POST /api/chat/send', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.checkDataRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
    mocks.validateConfig.mockReturnValue({
      valid: true,
      config: { botToken: '123:abc', chatId: '456', groupId: undefined },
    });
    mocks.addVisitorMessage.mockResolvedValue({
      id: 'msg-1',
      text: 'hello',
      sender: 'visitor',
      timestamp: 1000,
    });
    mocks.getSession.mockResolvedValue({
      visitorId: 'v1',
      aiMode: true,
      lastActive: 1000,
      lastAdminReplyTime: 0,
    });
    mocks.createOrUpdateSession.mockResolvedValue({
      visitorId: 'v1',
      aiMode: true,
      lastActive: 1000,
      lastAdminReplyTime: 0,
    });
    mocks.getAllMessages.mockResolvedValue([]);
    mocks.generateResponse.mockResolvedValue({ text: 'AI reply' });
    mocks.addAiReply.mockResolvedValue({
      id: 'ai-1',
      text: 'AI reply',
      sender: 'admin',
      timestamp: 2000,
    });
  });

  it('returns 500 when Telegram is not configured', async () => {
    mocks.validateConfig.mockReturnValue({ valid: false, error: 'No token' });

    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Hello', visitorId: 'v1' }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('Telegram not configured');
  });

  it('returns 500 when botToken or chatId is missing', async () => {
    mocks.validateConfig.mockReturnValue({
      valid: true,
      config: { botToken: '', chatId: '', groupId: undefined },
    });

    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Hello', visitorId: 'v1' }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Telegram not configured');
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing required fields');
  });

  it('returns 400 when visitorId is missing', async () => {
    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Hello' }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing required fields');
  });

  it('returns 429 when rate limited', async () => {
    mocks.checkDataRateLimit.mockResolvedValue({ allowed: false, retryAfter: 60 });

    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Hello', visitorId: 'v1' }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe('Too many messages. Please wait before sending again.');
    expect(body.retryAfter).toBe(60);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('sends message and triggers AI response on success', async () => {
    vi.stubGlobal('fetch', mockTelegramResponse(true, { message_id: 101 }));

    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Hello', visitorId: 'v1', pageUrl: 'https://example.com' }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message.id).toBe('msg-1');
    expect(mocks.addVisitorMessage).toHaveBeenCalledWith('v1', 'Hello');
    expect(mocks.setTypingStatus).toBeDefined(); // typing indicator was set
    expect(mocks.generateResponse).toHaveBeenCalled();
    expect(mocks.addAiReply).toHaveBeenCalledWith('v1', 'AI reply');
  });

  it('bypasses AI when session has aiMode disabled', async () => {
    mocks.getSession.mockResolvedValue({
      visitorId: 'v1',
      aiMode: false,
      lastActive: 1000,
      lastAdminReplyTime: 0,
    });
    vi.stubGlobal('fetch', mockTelegramResponse(true, { message_id: 101 }));

    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Hello', visitorId: 'v1' }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.generateResponse).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected errors', async () => {
    mocks.addVisitorMessage.mockRejectedValue(new Error('DB failure'));

    const response = await POST(
      new Request('http://localhost/api/chat/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Hello', visitorId: 'v1' }),
      }) as never
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to send message');
  });
});
