import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const mocks = vi.hoisted(() => ({
  refMock: vi.fn(),
}));

vi.mock('@/lib/database', () => ({
  db: {
    ref: mocks.refMock,
  },
}));

import { GET } from './route';
import { NextRequest } from 'next/server';

function makeRefChain(valData: unknown = null, exists = false) {
  const chain: Record<string, Mock> = {};
  chain.once = vi.fn().mockResolvedValue({ exists: () => exists, val: () => valData });
  chain.orderByChild = vi.fn().mockReturnValue(chain);
  chain.limitToLast = vi.fn().mockReturnValue(chain);
  return chain;
}

describe('GET /api/feedback/approved', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.refMock.mockReturnValue(makeRefChain(null, false));
  });

  it('returns empty list when no feedback exists', async () => {
    const request = new NextRequest('http://localhost/api/feedback/approved?limit=5&minRating=1');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.feedback).toEqual([]);
    expect(body.data.cached).toBe(false);
  });

  it('filters only approved and public feedback', async () => {
    mocks.refMock.mockReturnValue(
      makeRefChain(
        {
          f1: {
            rating: 5,
            status: 'approved',
            isPublic: true,
            message: 'Great',
            name: 'User A',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          f2: {
            rating: 3,
            status: 'pending',
            isPublic: false,
            message: 'Not visible',
            name: 'User B',
            createdAt: '2026-01-02T00:00:00.000Z',
          },
          f3: {
            rating: 4,
            status: 'approved',
            isPublic: true,
            message: 'Nice',
            name: 'User C',
            createdAt: '2026-01-03T00:00:00.000Z',
          },
          f4: {
            rating: 2,
            status: 'approved',
            isPublic: true,
            message: 'Low rating',
            name: 'User D',
            createdAt: '2026-01-04T00:00:00.000Z',
          },
        },
        true
      )
    );

    const request = new NextRequest(
      'http://localhost/api/feedback/approved?foo=bar&limit=10&minRating=4'
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.feedback).toHaveLength(2);

    const ids = body.data.feedback.map((f: { id: string }) => f.id);
    expect(ids).toContain('f1');
    expect(ids).toContain('f3');
    expect(ids).not.toContain('f2');
    expect(ids).not.toContain('f4');
  });

  it('uses default parameters when no query provided', async () => {
    mocks.refMock.mockReturnValue(
      makeRefChain(
        {
          f1: {
            rating: 5,
            status: 'approved',
            isPublic: true,
            message: 'Great',
            name: 'User A',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        },
        true
      )
    );

    // Use explicit params to avoid cache collision with other tests
    const request = new NextRequest('http://localhost/api/feedback/approved?bust=nocache');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.feedback).toHaveLength(1);
  });

  it('respects limit parameter', async () => {
    const feedback: Record<string, unknown> = {};
    for (let i = 1; i <= 10; i++) {
      feedback[`f${i}`] = {
        rating: 5,
        status: 'approved',
        isPublic: true,
        message: `Message ${i}`,
        name: `User ${i}`,
        createdAt: `2026-01-${String(i).padStart(2, '0')}T00:00:00.000Z`,
      };
    }

    mocks.refMock.mockReturnValue(makeRefChain(feedback, true));

    const request = new NextRequest('http://localhost/api/feedback/approved?limit=3&minRating=5');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.feedback).toHaveLength(3);
  });

  it('returns 500 on database error', async () => {
    mocks.refMock.mockReturnValue({
      orderByChild: vi.fn().mockReturnThis(),
      limitToLast: vi.fn().mockReturnThis(),
      once: vi.fn().mockRejectedValue(new Error('DB failure')),
    });

    // Use unique params to avoid CacheManager collision across tests
    const request = new NextRequest('http://localhost/api/feedback/approved?limit=99&minRating=5');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.errorCode).toBe('INTERNAL_ERROR');
  });
});
