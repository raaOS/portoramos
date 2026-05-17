import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashPasswordSha256 } from '@/lib/security';

const { refMock, cookiesMock, enforceRequestRateLimitMock } = vi.hoisted(() => ({
    refMock: vi.fn(),
    cookiesMock: vi.fn(),
    enforceRequestRateLimitMock: vi.fn(),
}));

vi.mock('next/headers', () => ({
    cookies: cookiesMock,
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

describe('POST /api/os/verify-password', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        enforceRequestRateLimitMock.mockResolvedValue({ allowed: true, retryAfter: 0 });
    });

    it('upgrades a legacy sha256 password record to scrypt after a successful unlock', async () => {
        const csrfToken = 'a'.repeat(64);
        const updateMock = vi.fn().mockResolvedValue(undefined);

        cookiesMock.mockResolvedValue({
            get: vi.fn().mockReturnValue({ value: csrfToken })
        });

        refMock.mockImplementation((path: string) => {
            if (path === 'os-settings') {
                return {
                    once: vi.fn().mockResolvedValue({
                        val: () => ({
                            passwordHash: hashPasswordSha256('Secret123!'),
                            passwordAlgorithm: 'sha256'
                        })
                    }),
                    update: updateMock,
                };
            }

            throw new Error(`Unexpected CLOUDFLARE_D1 path: ${path}`);
        });

        const response = await POST(new Request('http://localhost/api/os/verify-password', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-csrf-token': csrfToken,
                'user-agent': 'Vitest'
            },
            body: JSON.stringify({ password: 'Secret123!' })
        }) as never);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ success: true });
        expect(updateMock).toHaveBeenCalledTimes(1);

        const [upgradedRecord] = updateMock.mock.calls[0];
        expect(upgradedRecord.passwordAlgorithm).toBe('scrypt');
        expect(upgradedRecord.passwordSalt).toMatch(/^[a-f0-9]{32}$/);
        expect(upgradedRecord.passwordHash).toMatch(/^[a-f0-9]{128}$/);
    });

    it('rejects requests with an invalid CSRF token before touching storage', async () => {
        cookiesMock.mockResolvedValue({
            get: vi.fn().mockReturnValue({ value: 'b'.repeat(64) })
        });

        const response = await POST(new Request('http://localhost/api/os/verify-password', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-csrf-token': 'a'.repeat(64),
            },
            body: JSON.stringify({ password: 'Secret123!' })
        }) as never);
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body).toEqual({ error: 'Invalid or missing CSRF token' });
        expect(refMock).not.toHaveBeenCalled();
    });
});

