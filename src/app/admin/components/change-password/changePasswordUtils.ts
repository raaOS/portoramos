/**
 * Pure helpers untuk ChangePasswordModal — terpisah agar mudah diuji.
 */

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
  width?: string;
};

export function getPasswordStrength(pass: string): PasswordStrength {
  if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };

  let score = 0;
  if (pass.length >= 8) score += 1;
  if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
  if (/\d/.test(pass)) score += 1;
  if (/[^a-zA-Z\d]/.test(pass)) score += 1;

  if (score <= 1 || pass.length < 8)
    return { score: 1, label: 'Lemah', color: 'bg-red-500', width: '33.33%' };
  if (score === 2 || score === 3)
    return { score: 2, label: 'Sedang', color: 'bg-orange-500', width: '66.66%' };
  return { score: 3, label: 'Sangat Kuat', color: 'bg-[#00AA5B]', width: '100%' };
}

/**
 * Validasi form permintaan OTP. Mengembalikan pesan error atau null jika valid.
 */
export function validateOtpRequest(
  activeTab: 'password' | 'pin',
  fields: { newPassword: string; confirmPassword: string; newPin: string; confirmPin: string }
): string | null {
  const { newPassword, confirmPassword, newPin, confirmPin } = fields;

  if (activeTab === 'password') {
    if (newPassword !== confirmPassword) {
      return 'Sandi baru dan konfirmasi sandi tidak cocok.';
    }
    if (newPassword.length < 8) {
      return 'Sandi baru harus minimal 8 karakter.';
    }
    return null;
  }

  if (newPin !== confirmPin) {
    return 'PIN baru dan konfirmasi PIN tidak cocok.';
  }
  if (!/^\d{4}$/.test(newPin)) {
    return 'PIN baru harus berupa 4 digit angka.';
  }
  return null;
}

/**
 * Validasi kode OTP sebelum dikirim ke server.
 */
export function validateOtpCode(otpCode: string): string | null {
  if (otpCode.length !== 6) {
    return 'Kode OTP harus 6 digit angka.';
  }
  return null;
}

/** Hanya izinkan digit angka (dipakai input PIN & OTP). */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}
