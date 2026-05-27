import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest, verifyAdminPassword, hashPasswordScrypt } from '@/lib/auth';
import { db } from '@/lib/database';
import { sendTelegramAlert } from '@/lib/telegram';
import { getClientIdentifier } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Validasi Auth & CSRF
    const isValid = await validateAdminRequest(request, { checkCsrf: true });
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    // 2. Parse Body
    const body = await request.json();
    const { oldPassword, newPassword, otpCode } = body;

    if (!oldPassword || typeof oldPassword !== 'string') {
      return NextResponse.json({ error: 'Sandi lama wajib diisi' }, { status: 400 });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Sandi baru wajib diisi dan minimal 8 karakter' },
        { status: 400 }
      );
    }

    if (!otpCode || typeof otpCode !== 'string' || otpCode.length !== 6) {
      return NextResponse.json({ error: 'Kode OTP tidak valid' }, { status: 400 });
    }

    // 3. Verifikasi Sandi Lama
    let isOldValid = false;
    try {
      isOldValid = await verifyAdminPassword(oldPassword);
    } catch {
      return NextResponse.json({ error: 'Kesalahan layanan autentikasi' }, { status: 500 });
    }

    if (!isOldValid) {
      return NextResponse.json({ error: 'Sandi lama tidak sesuai' }, { status: 401 });
    }

    // 4. Verifikasi OTP
    const salt = process.env.PASSWORD_SALT;
    if (!salt) {
      return NextResponse.json(
        { error: 'Konfigurasi PASSWORD_SALT tidak ditemukan di environment' },
        { status: 500 }
      );
    }

    const otpSnap = await db.ref('settings/adminOtp').once('value');
    const otpData = otpSnap.val();

    if (
      !otpData ||
      typeof otpData !== 'object' ||
      otpData.status !== 'approved' ||
      !otpData.codeHash ||
      !otpData.expiresAt
    ) {
      return NextResponse.json({ error: 'Sesi OTP tidak ditemukan atau sudah kadaluarsa. Silakan request ulang.' }, { status: 400 });
    }

    if (Date.now() > otpData.expiresAt) {
      await db.ref('settings/adminOtp').remove();
      return NextResponse.json({ error: 'Kode OTP sudah kadaluarsa (lebih dari 5 menit). Silakan request ulang.' }, { status: 400 });
    }

    const hashedInputOtp = hashPasswordScrypt(otpCode, salt);
    // Kita buat helper lokal jika `timingSafeEqualString` tidak tersedia langsung dari utils
    // Tapi karena sudah diimport, langsung pakai saja
    let isOtpValid = false;
    try {
      // Gunakan crypto module Node.js secara langsung untuk timing safe
      const crypto = await import('crypto');
      const bufA = Buffer.from(hashedInputOtp);
      const bufB = Buffer.from(otpData.codeHash);
      if (bufA.length === bufB.length) {
        isOtpValid = crypto.timingSafeEqual(bufA, bufB);
      }
    } catch {
       isOtpValid = hashedInputOtp === otpData.codeHash; // fallback jika timing safe gagal dipanggil
    }

    if (!isOtpValid) {
      return NextResponse.json({ error: 'Kode OTP salah' }, { status: 401 });
    }

    // 5. Generate Hash Baru & Simpan
    const hashedNewPassword = hashPasswordScrypt(newPassword, salt);
    await db.ref('settings/adminPassword').set(hashedNewPassword);

    // Bersihkan OTP dari database
    await db.ref('settings/adminOtp').remove();

    // 6. Kirim Telegram Alert dengan Panic Button
    const clientId = getClientIdentifier(request);
    const pipeIdx = clientId.indexOf('|');
    const ip = pipeIdx > -1 ? clientId.substring(0, pipeIdx) : clientId;
    const userAgent = pipeIdx > -1 ? clientId.substring(pipeIdx + 1) : 'unknown';

    const alertMessage = `⚠️ **SANDI ADMIN BERHASIL DIUBAH**

Seseorang baru saja berhasil mengubah sandi admin Anda menggunakan OTP.

💻 **Device:** ${userAgent}
📡 **IP:** \`${ip}\``;

    await sendTelegramAlert(alertMessage, {
      priority: 'high'
    });

    // 7. Response Sukses
    return NextResponse.json({
      success: true,
      message: 'Sandi admin berhasil diubah!',
    });
  } catch (error) {
    console.error('[API/Admin/Password] Update failed:', error);
    return NextResponse.json({ error: 'Gagal mengubah sandi' }, { status: 500 });
  }
}
