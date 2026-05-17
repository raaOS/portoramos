import { beforeEach, describe, expect, it, vi } from 'vitest';

const { validateAdminRequestMock, refMock, setMock } = vi.hoisted(() => ({
    validateAdminRequestMock: vi.fn(),
    refMock: vi.fn(),
    setMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
    validateAdminRequest: validateAdminRequestMock,
}));

vi.mock('@/lib/database', () => ({
    db: {
        ref: refMock,
    },
}));

import { POST } from './route';

function buildPost(body: unknown): Request {
    return new Request('http://localhost/api/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /api/settings', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        validateAdminRequestMock.mockResolvedValue(true);
        refMock.mockReturnValue({ set: setMock });
        setMock.mockResolvedValue(undefined);
    });

    it('rejects unauthenticated', async () => {
        validateAdminRequestMock.mockResolvedValue(false);
        const response = await POST(buildPost({ bannedWords: [] }) as never);
        expect(response.status).toBe(401);
    });

    it('rejects bannedWords non-array', async () => {
        // updateSettingsSchema mengizinkan passthrough tapi bannedWords harus array
        const response = await POST(buildPost({ bannedWords: 'word' }) as never);
        expect(response.status).toBe(400);
    });

    it('rejects banned word > 50 chars', async () => {
        const response = await POST(
            buildPost({ bannedWords: ['x'.repeat(51)] }) as never
        );
        expect(response.status).toBe(400);
    });

    it('accepts valid payload', async () => {
        const response = await POST(
            buildPost({ bannedWords: ['judol', 'slot'] }) as never
        );
        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.settings.bannedWords).toEqual(['judol', 'slot']);
        expect(setMock).toHaveBeenCalled();
    });

    it('passes through flag fields (maintenanceMode, allowComments)', async () => {
        const response = await POST(
            buildPost({
                bannedWords: [],
                maintenanceMode: true,
                allowComments: false,
            }) as never
        );
        expect(response.status).toBe(200);
    });
});

