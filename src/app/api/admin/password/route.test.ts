import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  validateAdminRequestMock,
  verifyAdminPasswordMock,
  hashPasswordScryptMock,
  dbSetMock,
  dbRemoveMock,
  dbRefMock,
  sendTelegramAlertMock,
  getClientIdentifierMock,
  logAdminActivityMock,
} = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  verifyAdminPasswordMock: vi.fn(),
  hashPasswordScryptMock: vi.fn(),
  dbSetMock: vi.fn(),
  dbRemoveMock: vi.fn(),
  dbRefMock: vi.fn(),
  sendTelegramAlertMock: vi.fn(),
  getClientIdentifierMock: vi.fn(),
  logAdminActivityMock: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  validateAdminRequest: validateAdminRequestMock,
  verifyAdminPassword: verifyAdminPasswordMock,
  hashPasswordScrypt: hashPasswordScryptMock,
}));

vi.mock('@/lib/database', () => ({
  db: { ref: dbRefMock },
}));

vi.mock('@/lib/telegram', () => ({
  sendTelegramAlert: sendTelegramAlertMock,
}));

vi.mock('@/lib/security/request', () => ({
  getClientIdentifier: getClientIdentifierMock,
}));

vi.mock('@/lib/services/auditLogger', () => ({
  logAdminActivity: logAdminActivityMock,
}));

import { POST } from './route';
import { NextRequest } from 'next/server';

const HASH_OUTPUT = 'abcd1234abcd1234abcd1234abcd1234';
const originalPasswordSalt = process.env.PASSWORD_SALT;

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/admin/password', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'a'.repeat(64),
    },
    body: JSON.stringify(body),
  });
}

function makeValidOtpData(overrides: Record<string, unknown> = {}) {
  return {
    status: 'approved',
    codeHash: HASH_OUTPUT,
    expiresAt: Date.now() + 300000,
    ...overrides,
  };
}

let dbOnceMock: ReturnType<typeof vi.fn>;

describe('POST /api/admin/password', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dbOnceMock = vi.fn();
    dbRefMock.mockReturnValue({ once: dbOnceMock, set: dbSetMock, remove: dbRemoveMock });
    (process.env as Record<string, string | undefined>).PASSWORD_SALT = 'testsalt';
    hashPasswordScryptMock.mockReturnValue(HASH_OUTPUT);
    getClientIdentifierMock.mockReturnValue('1.2.3.4|TestBrowser');
    sendTelegramAlertMock.mockResolvedValue({ success: true });
  });

  afterAll(() => {
    (process.env as Record<string, string | undefined>).PASSWORD_SALT = originalPasswordSalt;
  });

  it('returns 401 when validateAdminRequest fails', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const res = await POST(makeRequest({ oldPassword: 'x', newPassword: 'x', otpCode: 'x' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized or invalid CSRF token');
  });

  it('returns 400 when oldPassword is missing', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ newPassword: '12345678', otpCode: '123456' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Sandi lama wajib diisi');
  });

  it('returns 400 when newPassword is missing', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ oldPassword: 'old1234', otpCode: '123456' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when newPassword is shorter than 8 characters', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(
      makeRequest({ oldPassword: 'old1234', newPassword: 'short', otpCode: '123456' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Sandi baru wajib diisi dan minimal 8 karakter');
  });

  it('returns 400 when otpCode is not exactly 6 characters', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(
      makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123', otpCode: '12345' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Kode OTP tidak valid');
  });

  it('returns 401 when old password is wrong', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(false);
    const res = await POST(
      makeRequest({ oldPassword: 'wrongold', newPassword: 'newpassword123', otpCode: '123456' })
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Sandi lama tidak sesuai');
  });

  it('returns 500 when verifyAdminPassword throws', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockRejectedValue(new Error('scrypt crash'));
    const res = await POST(
      makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123', otpCode: '123456' })
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Kesalahan layanan autentikasi');
  });

  it('returns 500 when PASSWORD_SALT is not configured', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    delete (process.env as Record<string, string | undefined>).PASSWORD_SALT;
    const res = await POST(
      makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123', otpCode: '123456' })
    );
    expect(res.status).toBe(500);
  });

  it('returns 400 when no OTP session exists', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({ val: () => null });
    const res = await POST(
      makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123', otpCode: '123456' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Sesi OTP tidak ditemukan');
  });

  it('returns 400 when OTP session is expired', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({
      val: () => makeValidOtpData({ expiresAt: Date.now() - 1000 }),
    });
    const res = await POST(
      makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123', otpCode: '123456' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Kode OTP sudah kadaluarsa');
    expect(dbRemoveMock).toHaveBeenCalled();
  });

  it('returns 401 when OTP code is wrong', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({
      val: () => makeValidOtpData({ codeHash: 'different_hash_value_x' }),
    });
    const res = await POST(
      makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123', otpCode: '123456' })
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Kode OTP salah');
  });

  it('returns 200 success on valid password change', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({ val: () => makeValidOtpData() });
    sendTelegramAlertMock.mockResolvedValue({ success: true });
    logAdminActivityMock.mockResolvedValue(undefined);

    const res = await POST(
      makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123', otpCode: '123456' })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('Sandi admin berhasil diubah!');

    expect(dbSetMock).toHaveBeenCalledWith(HASH_OUTPUT);
    expect(dbRemoveMock).toHaveBeenCalled();
    expect(sendTelegramAlertMock).toHaveBeenCalled();
    expect(logAdminActivityMock).toHaveBeenCalled();
  });

  it('returns 200 even when audit log fails (non-blocking)', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({ val: () => makeValidOtpData() });
    sendTelegramAlertMock.mockResolvedValue({ success: true });
    logAdminActivityMock.mockRejectedValue(new Error('audit db down'));

    const res = await POST(
      makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123', otpCode: '123456' })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 500 on generic catch error', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    dbOnceMock.mockRejectedValue(new Error('D1 connection lost'));
    const res = await POST(
      makeRequest({ oldPassword: 'old1234', newPassword: 'newpassword123', otpCode: '123456' })
    );
    expect(res.status).toBe(500);
  });
});
