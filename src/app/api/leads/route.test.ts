import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { refMock, validateAdminRequestMock } = vi.hoisted(() => ({
  refMock: vi.fn(),
  validateAdminRequestMock: vi.fn(),
}));

vi.mock('@/lib/database', () => ({
  db: {
    ref: refMock,
  },
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
}));

import { GET } from './route';

function buildRequest(freshParam = false): NextRequest {
  const url = freshParam ? 'http://localhost/api/leads?fresh=true' : 'http://localhost/api/leads';
  return new NextRequest(url, { method: 'GET' });
}

describe('GET /api/leads', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    validateAdminRequestMock.mockResolvedValue(true);
  });

  it('blocks unauthenticated requests', async () => {
    validateAdminRequestMock.mockResolvedValue(false);

    const response = await GET(buildRequest() as never);
    expect(response.status).toBe(401);
  });

  it('returns empty array when leads node tidak ada', async () => {
    refMock.mockReturnValue({
      once: vi.fn().mockResolvedValue({ val: () => null }),
    });

    const response = await GET(buildRequest(true) as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it('passes-through array format unchanged', async () => {
    const leadsArray = [
      { id: 'lead-1', name: 'Alice' },
      { id: 'lead-2', name: 'Bob' },
    ];
    refMock.mockReturnValue({
      once: vi.fn().mockResolvedValue({ val: () => leadsArray }),
    });

    const response = await GET(buildRequest(true) as never);
    const body = await response.json();

    expect(body).toEqual(leadsArray);
  });

  it('converts object format ke array dengan CLOUDFLARE_D1 key sebagai id', async () => {
    const leadsObject = {
      'CLOUDFLARE_D1-key-1': { name: 'Alice', message: 'Hello' },
      'CLOUDFLARE_D1-key-2': { name: 'Bob', message: 'Hi' },
    };
    refMock.mockReturnValue({
      once: vi.fn().mockResolvedValue({ val: () => leadsObject }),
    });

    const response = await GET(buildRequest(true) as never);
    const body = (await response.json()) as Array<{ id: string; name: string }>;

    expect(body).toHaveLength(2);
    expect(body[0].id).toBe('CLOUDFLARE_D1-key-1');
    expect(body[0].name).toBe('Alice');
    expect(body[1].id).toBe('CLOUDFLARE_D1-key-2');
  });

  it('tidak menimpa id internal ketika object punya id field', async () => {
    // REGRESSION: Sebelum fix, `{ id: key, ...leads[key] }` menimpa id
    // CLOUDFLARE_D1 dengan id internal — breaks admin panel mutation (butuh key).
    const leadsWithInternalId = {
      'CLOUDFLARE_D1-key-abc': {
        id: 'stale-internal-id',
        name: 'Charlie',
      },
    };
    refMock.mockReturnValue({
      once: vi.fn().mockResolvedValue({ val: () => leadsWithInternalId }),
    });

    const response = await GET(buildRequest(true) as never);
    const body = (await response.json()) as Array<{ id: string; name: string }>;

    expect(body[0].id).toBe('CLOUDFLARE_D1-key-abc');
    expect(body[0].name).toBe('Charlie');
  });
});
