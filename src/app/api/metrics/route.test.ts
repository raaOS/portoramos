import { beforeEach, describe, expect, it, vi } from 'vitest';

const { refMock, enforceRequestRateLimitMock, getProjectsMock } = vi.hoisted(() => ({
    refMock: vi.fn(),
    enforceRequestRateLimitMock: vi.fn(),
    getProjectsMock: vi.fn(),
}));

vi.mock('@/lib/database', () => ({
    db: {
        ref: refMock,
    }
}));

vi.mock('@/lib/security/request', () => ({
    enforceRequestRateLimit: enforceRequestRateLimitMock,
}));

vi.mock('@/lib/services/projectService', () => ({
    projectService: {
        getProjects: getProjectsMock,
    }
}));

import { POST } from './route';

describe('POST /api/metrics', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('blocks abusive requests with a persistent rate limiter', async () => {
        enforceRequestRateLimitMock.mockResolvedValue({ allowed: false, retryAfter: 60 });

        const response = await POST(new Request('http://localhost/api/metrics', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ slug: 'demo', action: 'like' })
        }) as never);
        const body = await response.json();

        expect(response.status).toBe(429);
        expect(body.error).toBe('Too many requests');
        expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('applies atomic like mutations on top of fallback metrics', async () => {
        enforceRequestRateLimitMock.mockResolvedValue({ allowed: true, retryAfter: 0 });
        getProjectsMock.mockResolvedValue({
            projects: [{ slug: 'demo', likes: 7, shares: 2 }],
            lastUpdated: new Date().toISOString()
        });

        refMock.mockImplementation((path: string) => {
            if (path === 'metrics/metrics/demo') {
                return {
                    transaction: vi.fn(async (updater: (current: { likes: number; shares: number } | null) => { likes: number; shares: number }) => {
                        updater(null);
                    })
                };
            }

            throw new Error(`Unexpected CLOUDFLARE_D1 path: ${path}`);
        });

        const response = await POST(new Request('http://localhost/api/metrics', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ slug: 'demo', action: 'like' })
        }) as never);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            success: true,
            metrics: {
                likes: 8,
                shares: 2
            }
        });
    });
});

