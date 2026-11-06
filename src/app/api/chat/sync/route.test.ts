import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkDataRateLimit: vi.fn(),
  enforceRequestRateLimit: vi.fn(),
  getAllMessages: vi.fn(),
  getTypingStatus: vi.fn(),
  verifyVisitorSession: vi.fn(),
}));

vi.mock('@/lib/dataRateLimit', () => ({
  checkDataRateLimit: mocks.checkDataRateLimit,
}));

vi.mock('@/lib/security/request', () => ({
  enforceRequestRateLimit: mocks.enforceRequestRateLimit,
}));

vi.mock('@/lib/chatSession', () => ({
  verifyVisitorSession: mocks.verifyVisitorSession,
}));

vi.mock('@/lib/chatStore', () => ({
  chatStore: {
    getAllMessages: mocks.getAllMessages,
    getTypingStatus: mocks.getTypingStatus,
  },
}));

import { GET } from './route';
import { NextRequest } from 'next/server';

describe('GET /api/chat/sync', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.checkDataRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
    mocks.enforceRequestRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
    mocks.verifyVisitorSession.mockReturnValue(true);
    mocks.getAllMessages.mockResolvedValue([]);
    mocks.getTypingStatus.mockResolvedValue(false);
  });

  it('returns 400 when visitorId is missing', async () => {
    const request = new NextRequest('http://localhost/api/chat/sync');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing visitorId');
  });

  it('returns 403 when signature is invalid (IDOR guard)', async () => {
    mocks.verifyVisitorSession.mockReturnValue(false);

    const request = new NextRequest('http://localhost/api/chat/sync?visitorId=v1&sig=bad');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Invalid chat session');
    expect(mocks.getAllMessages).not.toHaveBeenCalled();
  });

  it('returns 429 when IP rate limited', async () => {
    mocks.enforceRequestRateLimit.mockResolvedValue({ allowed: false, retryAfter: 60 });

    const request = new NextRequest('http://localhost/api/chat/sync?visitorId=v1&sig=ok');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe('Too many requests');
  });

  it('returns 429 when visitor rate limited', async () => {
    mocks.checkDataRateLimit.mockResolvedValue({ allowed: false, retryAfter: 60 });

    const request = new NextRequest('http://localhost/api/chat/sync?visitorId=v1&sig=ok');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe('Too many requests');
  });

  it('returns messages and typing status on success', async () => {
    const messages = [{ id: 'm1', text: 'Hello', sender: 'visitor', timestamp: 1000 }];
    mocks.getAllMessages.mockResolvedValue(messages);
    mocks.getTypingStatus.mockResolvedValue(true);

    const request = new NextRequest('http://localhost/api/chat/sync?visitorId=v1&sig=ok');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.messages).toEqual(messages);
    expect(body.isAdminTyping).toBe(true);
    expect(mocks.verifyVisitorSession).toHaveBeenCalledWith('v1', 'ok');
  });

  it('handles missing visitorId parameter even when other params present', async () => {
    const request = new NextRequest('http://localhost/api/chat/sync?foo=bar');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Missing visitorId');
  });

  it('returns 500 on unexpected errors', async () => {
    mocks.getAllMessages.mockRejectedValue(new Error('DB failure'));

    const request = new NextRequest('http://localhost/api/chat/sync?visitorId=v1&sig=ok');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to sync messages');
  });
});
