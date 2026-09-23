import { describe, it, expect } from 'vitest';

import {
  getPasswordStrength,
  validateOtpRequest,
  validateOtpCode,
  digitsOnly,
} from '../change-password/changePasswordUtils';

describe('changePasswordUtils', () => {
  describe('getPasswordStrength', () => {
    it('returns score 0 for empty password', () => {
      expect(getPasswordStrength('')).toEqual({ score: 0, label: '', color: 'bg-gray-200' });
    });

    it('returns Lemah for short or single-criteria passwords', () => {
      expect(getPasswordStrength('abc').score).toBe(1);
      expect(getPasswordStrength('abc').label).toBe('Lemah');
      expect(getPasswordStrength('abcdefgh').score).toBe(1); // panjang >=8 tapi 1 kriteria
    });

    it('returns Sedang for 2-3 criteria', () => {
      expect(getPasswordStrength('Abcdefgh').score).toBe(2); // length + case
      expect(getPasswordStrength('Abcdefg1').score).toBe(2); // length + case + digit
      expect(getPasswordStrength('Abcdefg1').label).toBe('Sedang');
    });

    it('returns Sangat Kuat for all criteria', () => {
      const result = getPasswordStrength('Abcdefg1!');
      expect(result.score).toBe(3);
      expect(result.label).toBe('Sangat Kuat');
      expect(result.width).toBe('100%');
    });
  });

  describe('validateOtpRequest', () => {
    const base = { newPassword: '', confirmPassword: '', newPin: '', confirmPin: '' };

    it('rejects mismatched passwords', () => {
      expect(
        validateOtpRequest('password', { ...base, newPassword: 'abcdefgh', confirmPassword: 'xxxxxxxx' })
      ).toBe('Sandi baru dan konfirmasi sandi tidak cocok.');
    });

    it('rejects passwords shorter than 8 chars', () => {
      expect(
        validateOtpRequest('password', { ...base, newPassword: 'abc', confirmPassword: 'abc' })
      ).toBe('Sandi baru harus minimal 8 karakter.');
    });

    it('accepts valid password pair', () => {
      expect(
        validateOtpRequest('password', { ...base, newPassword: 'abcdefgh', confirmPassword: 'abcdefgh' })
      ).toBeNull();
    });

    it('rejects mismatched PINs', () => {
      expect(validateOtpRequest('pin', { ...base, newPin: '1234', confirmPin: '9999' })).toBe(
        'PIN baru dan konfirmasi PIN tidak cocok.'
      );
    });

    it('rejects non-4-digit PINs', () => {
      expect(validateOtpRequest('pin', { ...base, newPin: '123', confirmPin: '123' })).toBe(
        'PIN baru harus berupa 4 digit angka.'
      );
      expect(validateOtpRequest('pin', { ...base, newPin: '12ab', confirmPin: '12ab' })).toBe(
        'PIN baru harus berupa 4 digit angka.'
      );
    });

    it('accepts valid PIN pair', () => {
      expect(validateOtpRequest('pin', { ...base, newPin: '1234', confirmPin: '1234' })).toBeNull();
    });
  });

  describe('validateOtpCode', () => {
    it('rejects codes that are not 6 chars', () => {
      expect(validateOtpCode('12345')).toBe('Kode OTP harus 6 digit angka.');
      expect(validateOtpCode('')).toBe('Kode OTP harus 6 digit angka.');
    });

    it('accepts 6-char code', () => {
      expect(validateOtpCode('123456')).toBeNull();
    });
  });

  describe('digitsOnly', () => {
    it('strips non-digit characters', () => {
      expect(digitsOnly('a1b2c3')).toBe('123');
      expect(digitsOnly('')).toBe('');
      expect(digitsOnly('1234')).toBe('1234');
    });
  });
});
