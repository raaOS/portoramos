import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

const { enforceRequestRateLimitMock, dbRefMock, hashPasswordScryptMock } = vi.hoisted(() => ({
  enforceRequestRateLimitMock: vi.fn(),
  dbRefMock: vi.fn(),
  hashPasswordScryptMock: vi.fn(),
}));

vi.mock('@/lib/security/request', () => ({
  enforceRequestRateLimit: enforceRequestRateLimitMock,
}));

vi.mock('@/lib/database', () => ({
  db: { ref: dbRefMock },
}));

vi.mock('@/lib/auth', () => ({
  hashPasswordScrypt: hashPasswordScryptMock,
}));

const HASH_OUTPUT = 'abcd1234abcd1234abcd1234abcd1234';
const originalPasswordSalt = process.env.PASSWORD_SALT;
const originalAdminPin = process.env.ADMIN_PIN;
const originalPublicAdminPin = process.env.NEXT_PUBLIC_ADMIN_PIN;

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/admin/pin/verify', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/pin/verify', () => {
  let dbOnceMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    dbOnceMock = vi.fn();
    dbRefMock.mockReturnValue({ once: dbOnceMock });
    enforceRequestRateLimitMock.mockResolvedValue({ allowed: true });
    (process.env as Record<string, string | undefined>).PASSWORD_SALT = 'testsalt';
    (process.env as Record<string, string | undefined>).ADMIN_PIN = '2101';
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_ADMIN_PIN = '2211';
    hashPasswordScryptMock.mockReturnValue(HASH_OUTPUT);
  });

  afterAll(() => {
    (process.env as Record<string, string | undefined>).PASSWORD_SALT = originalPasswordSalt;
    (process.env as Record<string, string | undefined>).ADMIN_PIN = originalAdminPin;
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_ADMIN_PIN =
      originalPublicAdminPin;
  });

  it('returns 429 when rate limit is exceeded', async () => {
    enforceRequestRateLimitMock.mockResolvedValue({ allowed: false, retryAfter: 60 });
    const res = await POST(makeRequest({ pin: '1234' }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('Terlalu banyak percobaan');
  });

  it('returns 400 when pin is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('PIN wajib diisi');
  });

  it('returns 401 when pin is incorrect (fallback case)', async () => {
    dbOnceMock.mockResolvedValue({ val: () => null });
    const res = await POST(makeRequest({ pin: '0000' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('PIN salah');
  });

  it('returns 200 when pin is correct (fallback case)', async () => {
    dbOnceMock.mockResolvedValue({ val: () => null });
    const res = await POST(makeRequest({ pin: '2101' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('ignores the legacy public pin env var', async () => {
    dbOnceMock.mockResolvedValue({ val: () => null });
    const res = await POST(makeRequest({ pin: '2211' }));
    expect(res.status).toBe(401);
  });

  it('returns 200 when pin matches D1 hash', async () => {
    dbOnceMock.mockResolvedValue({ val: () => HASH_OUTPUT });
    hashPasswordScryptMock.mockReturnValue(HASH_OUTPUT);
    const res = await POST(makeRequest({ pin: '1111' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 401 when pin does not match D1 hash', async () => {
    dbOnceMock.mockResolvedValue({ val: () => HASH_OUTPUT });
    hashPasswordScryptMock.mockReturnValue('wronghashvalue');
    const res = await POST(makeRequest({ pin: '1111' }));
    expect(res.status).toBe(401);
  });
});
