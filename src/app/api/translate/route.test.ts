import { beforeEach, describe, expect, it, vi } from 'vitest';

const { enforceRequestRateLimitMock, generateContentMock, getGenerativeModelMock } = vi.hoisted(() => ({
    enforceRequestRateLimitMock: vi.fn(),
    generateContentMock: vi.fn(),
    getGenerativeModelMock: vi.fn(),
}));

vi.mock('@/lib/security/request', () => ({
    enforceRequestRateLimit: enforceRequestRateLimitMock,
}));

vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: vi.fn(class MockGoogleGenerativeAI {
        getGenerativeModel = getGenerativeModelMock;
    })
}));

import { POST } from './route';

describe('POST /api/translate', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        getGenerativeModelMock.mockReturnValue({
            generateContent: generateContentMock,
        });
    });

    it('blocks rate-limited translation requests before invoking Gemini', async () => {
        enforceRequestRateLimitMock.mockResolvedValue({ allowed: false, retryAfter: 120 });

        const response = await POST(new Request('http://localhost/api/translate', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text: 'Halo', targetLanguage: 'en' })
        }) as never);
        const body = await response.json();

        expect(response.status).toBe(429);
        expect(body.error).toBe('Too many requests. Please try again later.');
        expect(generateContentMock).not.toHaveBeenCalled();
    });

    it('returns a translated string for valid single-text payloads', async () => {
        enforceRequestRateLimitMock.mockResolvedValue({ allowed: true, retryAfter: 0 });
        generateContentMock.mockResolvedValue({
            response: {
                text: () => JSON.stringify({ translation: 'Hello world' })
            }
        });

        const response = await POST(new Request('http://localhost/api/translate', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text: 'Halo dunia', targetLanguage: 'en' })
        }) as never);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ translation: 'Hello world' });
        expect(generateContentMock).toHaveBeenCalledTimes(1);
    });
});
