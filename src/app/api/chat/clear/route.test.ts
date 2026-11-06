import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  clearMessages: vi.fn(),
  enforceRequestRateLimit: vi.fn(),
  verifyVisitorSession: vi.fn(),
}));

vi.mock('@/lib/chatStore', () => ({
  chatStore: {
    clearMessages: mocks.clearMessages,
  },
}));

vi.mock('@/lib/security/request', () => ({
  enforceRequestRateLimit: mocks.enforceRequestRateLimit,
}));

vi.mock('@/lib/chatSession', () => ({
  verifyVisitorSession: mocks.verifyVisitorSession,
}));

import { POST } from './route';

describe('POST /api/chat/clear', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clearMessages.mockResolvedValue(true);
    mocks.enforceRequestRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
    mocks.verifyVisitorSession.mockReturnValue(true);
  });

  it('returns 400 if visitorId is missing', async () => {
    const req = new Request('http://localhost/api/chat/clear', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Missing visitorId');
  });

  it('returns 403 when signature is invalid', async () => {
    mocks.verifyVisitorSession.mockReturnValue(false);

    const req = new Request('http://localhost/api/chat/clear', {
      method: 'POST',
      body: JSON.stringify({ visitorId: 'v123', signature: 'bad' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Invalid chat session');
    expect(mocks.clearMessages).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limited', async () => {
    mocks.enforceRequestRateLimit.mockResolvedValue({ allowed: false, retryAfter: 30 });

    const req = new Request('http://localhost/api/chat/clear', {
      method: 'POST',
      body: JSON.stringify({ visitorId: 'v123', signature: 'sig' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(mocks.clearMessages).not.toHaveBeenCalled();
  });

  it('clears chat history successfully when valid session is provided', async () => {
    const req = new Request('http://localhost/api/chat/clear', {
      method: 'POST',
      body: JSON.stringify({ visitorId: 'v123', signature: 'valid-sig' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mocks.verifyVisitorSession).toHaveBeenCalledWith('v123', 'valid-sig');
    expect(mocks.clearMessages).toHaveBeenCalledWith('v123');
  });
});
