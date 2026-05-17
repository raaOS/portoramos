import { beforeEach, describe, expect, it, vi } from 'vitest';

const { refMock, enforceRequestRateLimitMock } = vi.hoisted(() => ({
    refMock: vi.fn(),
    enforceRequestRateLimitMock: vi.fn(),
}));

vi.mock('@/lib/database', () => ({
    db: {
        ref: refMock,
    }
}));

vi.mock('@/lib/security/request', () => ({
    enforceRequestRateLimit: enforceRequestRateLimitMock,
}));

import { POST } from './route';

describe('POST /api/analytics', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('rejects abusive analytics writes with rate limiting', async () => {
        enforceRequestRateLimitMock.mockResolvedValue({ allowed: false, retryAfter: 30 });

        const response = await POST(new Request('http://localhost/api/analytics', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ event: 'page_view' })
        }) as never);
        const body = await response.json();

        expect(response.status).toBe(429);
        expect(body).toEqual({ success: false, error: 'Too many requests' });
        expect(response.headers.get('Retry-After')).toBe('30');
    });

    it('validates analytics payloads before writing to CLOUDFLARE_D1', async () => {
        enforceRequestRateLimitMock.mockResolvedValue({ allowed: true, retryAfter: 0 });

        const response = await POST(new Request('http://localhost/api/analytics', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ event: '' })
        }) as never);
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body).toEqual({ success: false, error: 'Invalid analytics payload' });
        expect(refMock).not.toHaveBeenCalled();
    });
});

