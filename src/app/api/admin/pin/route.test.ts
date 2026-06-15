import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

const {
  validateAdminRequestMock,
  verifyAdminPasswordMock,
  hashPasswordScryptMock,
  dbSetMock,
  dbRemoveMock,
  dbRefMock,
  sendSecurityAlertMock,
  getClientIdentifierMock,
  logAdminActivityMock,
} = vi.hoisted(() => ({
  validateAdminRequestMock: vi.fn(),
  verifyAdminPasswordMock: vi.fn(),
  hashPasswordScryptMock: vi.fn(),
  dbSetMock: vi.fn(),
  dbRemoveMock: vi.fn(),
  dbRefMock: vi.fn(),
  sendSecurityAlertMock: vi.fn(),
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
  sendSecurityAlert: sendSecurityAlertMock,
}));

vi.mock('@/lib/security/request', () => ({
  getClientIdentifier: getClientIdentifierMock,
}));

vi.mock('@/lib/services/auditLogger', () => ({
  logAdminActivity: logAdminActivityMock,
}));

const HASH_OUTPUT = 'abcd1234abcd1234abcd1234abcd1234';
const originalPasswordSalt = process.env.PASSWORD_SALT;

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/admin/pin', {
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
    purpose: 'pin',
    codeHash: HASH_OUTPUT,
    expiresAt: Date.now() + 300000,
    ...overrides,
  };
}

describe('POST /api/admin/pin', () => {
  let dbOnceMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    dbOnceMock = vi.fn();
    dbRefMock.mockReturnValue({ once: dbOnceMock, set: dbSetMock, remove: dbRemoveMock });
    (process.env as Record<string, string | undefined>).PASSWORD_SALT = 'testsalt';
    hashPasswordScryptMock.mockReturnValue(HASH_OUTPUT);
    getClientIdentifierMock.mockReturnValue('1.2.3.4|TestBrowser');
    sendSecurityAlertMock.mockResolvedValue({ success: true });
    logAdminActivityMock.mockResolvedValue(undefined);
  });

  afterAll(() => {
    (process.env as Record<string, string | undefined>).PASSWORD_SALT = originalPasswordSalt;
  });

  it('returns 401 when validateAdminRequest fails', async () => {
    validateAdminRequestMock.mockResolvedValue(false);
    const res = await POST(makeRequest({ oldPassword: 'x', newPin: '1234', otpCode: '123456' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when oldPassword is missing', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ newPin: '1234', otpCode: '123456' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Sandi lama wajib diisi');
  });

  it('returns 400 when newPin is missing', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(makeRequest({ oldPassword: 'oldpassword', otpCode: '123456' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when newPin is not exactly 4 digits', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(
      makeRequest({ oldPassword: 'oldpassword', newPin: '123', otpCode: '123456' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('PIN baru wajib 4 digit angka');
  });

  it('returns 400 when otpCode is not exactly 6 characters', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    const res = await POST(
      makeRequest({ oldPassword: 'oldpassword', newPin: '1234', otpCode: '12345' })
    );
    expect(res.status).toBe(400);
  });

  it('returns 401 when old password is wrong', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(false);
    const res = await POST(
      makeRequest({ oldPassword: 'wrongold', newPin: '1234', otpCode: '123456' })
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when no OTP session exists', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({ val: () => null });
    const res = await POST(
      makeRequest({ oldPassword: 'correctold', newPin: '1234', otpCode: '123456' })
    );
    expect(res.status).toBe(400);
  });

  it('rejects an approved password OTP session', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({ val: () => makeValidOtpData({ purpose: 'password' }) });

    const res = await POST(
      makeRequest({ oldPassword: 'correctold', newPin: '1234', otpCode: '123456' })
    );
    expect(res.status).toBe(400);
    expect(dbRefMock).toHaveBeenCalledWith('settings/adminPinOtp');
    expect(dbSetMock).not.toHaveBeenCalled();
    expect(sendSecurityAlertMock).not.toHaveBeenCalled();
  });

  it('returns 200 success on valid PIN change', async () => {
    validateAdminRequestMock.mockResolvedValue(true);
    verifyAdminPasswordMock.mockResolvedValue(true);
    dbOnceMock.mockResolvedValue({ val: () => makeValidOtpData() });

    const res = await POST(
      makeRequest({ oldPassword: 'correctold', newPin: '1234', otpCode: '123456' })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe('PIN admin berhasil diubah!');

    expect(dbRefMock).toHaveBeenCalledWith('settings/adminPinOtp');
    expect(dbSetMock).toHaveBeenCalledWith(HASH_OUTPUT);
    expect(dbRemoveMock).toHaveBeenCalled();
    expect(sendSecurityAlertMock).toHaveBeenCalled();
  });
});
