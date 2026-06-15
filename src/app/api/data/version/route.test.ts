import { beforeEach, describe, expect, it, vi } from 'vitest';

const { refMock } = vi.hoisted(() => ({
  refMock: vi.fn(),
}));

vi.mock('@/lib/database', () => ({
  db: {
    ref: refMock,
  },
  getDatabaseBackend: () => 'cloudflare-d1',
}));

import { GET } from './route';

describe('GET /api/data/version', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns lastUpdated from Cloudflare D1', async () => {
    const mockTimestamp = '2026-01-01T00:00:00.000Z';
    refMock.mockReturnValue({
      once: vi.fn().mockResolvedValue({ val: () => mockTimestamp }),
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.backend).toBe('cloudflare-d1');
    expect(body.lastUpdated).toBe(mockTimestamp);
    expect(body.timestamp).toBeDefined();
    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
  });

  it('returns null lastUpdated when key is missing', async () => {
    refMock.mockReturnValue({
      once: vi.fn().mockResolvedValue({ val: () => null }),
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.lastUpdated).toBeNull();
  });

  it('returns 500 on network failure', async () => {
    refMock.mockReturnValue({
      once: vi.fn().mockRejectedValue(new Error('Connection lost')),
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to read data version');
  });
});
