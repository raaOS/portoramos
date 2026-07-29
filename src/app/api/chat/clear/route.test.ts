import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/chatStore', () => ({
  chatStore: {
    clearMessages: vi.fn().mockResolvedValue(true),
  },
}));

describe('POST /api/chat/clear', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('clears chat history successfully when valid visitorId is provided', async () => {
    const req = new Request('http://localhost/api/chat/clear', {
      method: 'POST',
      body: JSON.stringify({ visitorId: 'v123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
