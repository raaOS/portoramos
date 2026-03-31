import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
    validateAdminRequest: vi.fn(),
}));

vi.mock('@/lib/telegram', () => ({
    getTelegramConfigSafe: vi.fn(),
}));

import { GET } from './route';
import { validateAdminRequest } from '@/lib/auth';
import { getTelegramConfigSafe } from '@/lib/telegram';

describe('GET /api/admin/telegram/config', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('rejects unauthenticated access', async () => {
        vi.mocked(validateAdminRequest).mockResolvedValue(false);

        const response = await GET(new Request('http://localhost/api/admin/telegram/config') as never);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns only the safe telegram config without leaking bot token', async () => {
        vi.mocked(validateAdminRequest).mockResolvedValue(true);
        vi.mocked(getTelegramConfigSafe).mockResolvedValue({
            configured: true,
            botToken: '12345...token',
            chatId: '123456',
            groupId: undefined,
        });

        const response = await GET(new Request('http://localhost/api/admin/telegram/config') as never);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.chatId).toBe('123456');
        expect(body.botToken).toBe('12345...token');
        expect(body).not.toHaveProperty('_botToken');
    });
});
