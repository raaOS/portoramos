import { beforeEach, describe, expect, it, vi } from 'vitest';

const { refMock } = vi.hoisted(() => ({
    refMock: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
    db: {
        ref: refMock,
    }
}));

import { POST } from './route';

type StoredComment = {
    id: string;
    text: string;
    name: string;
    createdAt: string;
    time?: string;
    author?: string;
};

describe('POST /api/comments', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('appends a single sanitized comment instead of accepting a client-side overwrite array', async () => {
        const existingComments: StoredComment[] = [{
            id: 'existing',
            text: 'Existing comment',
            name: 'Alice',
            createdAt: '2026-03-30T10:00:00.000Z',
            time: '2026-03-30T10:00:00.000Z',
        }];

        let storedComments: StoredComment[] | undefined;

        refMock.mockImplementation((path: string) => {
            if (path === 'settings/bannedWords') {
                return {
                    once: vi.fn().mockResolvedValue({
                        exists: () => true,
                        val: () => [],
                    })
                };
            }

            if (path === 'comments/demo-project') {
                return {
                    transaction: vi.fn(async (updater: (current: StoredComment[] | null) => StoredComment[] | void) => {
                        const next = updater(existingComments);
                        storedComments = next as StoredComment[] | undefined;
                        return { committed: Boolean(next) };
                    })
                };
            }

            throw new Error(`Unexpected Firebase path: ${path}`);
        });

        const response = await POST(new Request('http://localhost/api/comments', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                slug: 'demo-project',
                comments: [
                    { id: 'new-comment', text: 'Hello <b>team</b>', name: '<Admin>' },
                    { id: 'tampered', text: 'overwrite', name: 'Mallory' }
                ]
            })
        }) as never);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.comment.id).toBe('new-comment');
        expect(body.data.comment.name).toBe('Admin');
        expect(storedComments).toHaveLength(2);
        expect(storedComments?.[0].id).toBe('new-comment');
        expect(storedComments?.[1]).toEqual(existingComments[0]);
        expect(storedComments?.some(comment => comment.id === 'tampered')).toBe(false);
    });

    it('rate-limits rapid repeat comments from the same author', async () => {
        const existingComments: StoredComment[] = [{
            id: 'existing',
            text: 'Latest comment',
            name: 'Alice',
            createdAt: new Date().toISOString(),
            time: new Date().toISOString(),
        }];

        refMock.mockImplementation((path: string) => {
            if (path === 'settings/bannedWords') {
                return {
                    once: vi.fn().mockResolvedValue({
                        exists: () => true,
                        val: () => [],
                    })
                };
            }

            if (path === 'comments/demo-project') {
                return {
                    transaction: vi.fn(async (updater: (current: StoredComment[] | null) => StoredComment[] | void) => {
                        const next = updater(existingComments);
                        return { committed: Boolean(next) };
                    })
                };
            }

            throw new Error(`Unexpected Firebase path: ${path}`);
        });

        const response = await POST(new Request('http://localhost/api/comments', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                slug: 'demo-project',
                comment: { id: 'new-comment', text: 'Another comment', name: 'Alice' }
            })
        }) as never);
        const body = await response.json();

        expect(response.status).toBe(429);
        expect(body.error).toBe('Please wait 5 seconds before posting again');
    });
});
