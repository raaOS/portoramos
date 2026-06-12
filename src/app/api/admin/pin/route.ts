import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { validateAdminRequest, verifyAdminPassword, hashPasswordScrypt } from '@/lib/auth';
import { db } from '@/lib/database';
import { sendSecurityAlert } from '@/lib/telegram';
import { getClientIdentifier } from '@/lib/security/request';
import { logAdminActivity } from '@/lib/services/auditLogger';

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
    const { oldPassword, newPin, otpCode } = body;

    if (!oldPassword || typeof oldPassword !== 'string') {
      return NextResponse.json({ error: 'Sandi lama wajib diisi' }, { status: 400 });
    }

    if (!newPin || typeof newPin !== 'string' || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json({ error: 'PIN baru wajib 4 digit angka' }, { status: 400 });
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

    const otpSnap = await db.ref('settings/adminPinOtp').once('value');
    const otpData = otpSnap.val();

    if (
      !otpData ||
      typeof otpData !== 'object' ||
      otpData.purpose !== 'pin' ||
      otpData.status !== 'approved' ||
      !otpData.codeHash ||
      !otpData.expiresAt
    ) {
      return NextResponse.json(
        { error: 'Sesi OTP tidak ditemukan atau sudah kadaluarsa. Silakan request ulang.' },
        { status: 400 }
      );
    }

    if (Date.now() > otpData.expiresAt) {
      await db.ref('settings/adminPinOtp').remove();
      return NextResponse.json(
        { error: 'Kode OTP sudah kadaluarsa (lebih dari 5 menit). Silakan request ulang.' },
        { status: 400 }
      );
    }

    const hashedInputOtp = hashPasswordScrypt(otpCode, salt);
    let isOtpValid = false;
    try {
      const bufA = Buffer.from(hashedInputOtp);
      const bufB = Buffer.from(otpData.codeHash);
      if (bufA.length === bufB.length) {
        isOtpValid = crypto.timingSafeEqual(bufA, bufB);
      }
    } catch (compareError) {
      console.error('[Admin PIN] OTP compare failed:', compareError);
      return NextResponse.json({ error: 'Kesalahan layanan autentikasi' }, { status: 500 });
    }

    if (!isOtpValid) {
      return NextResponse.json({ error: 'Kode OTP salah' }, { status: 401 });
    }

    // 5. Generate Hash PIN Baru & Simpan
    const hashedNewPin = hashPasswordScrypt(newPin, salt);
    await db.ref('settings/adminPin').set(hashedNewPin);

    // Bersihkan OTP dari database
    await db.ref('settings/adminPinOtp').remove();

    // 6. Kirim Telegram Alert
    const clientId = getClientIdentifier(request);
    const pipeIdx = clientId.indexOf('|');
    const ip = pipeIdx > -1 ? clientId.substring(0, pipeIdx) : clientId;
    const userAgent = pipeIdx > -1 ? clientId.substring(pipeIdx + 1) : 'unknown';

    await sendSecurityAlert({
      title: '⚠️ **PIN ADMIN BERHASIL DIUBAH**',
      description: 'Seseorang baru saja berhasil mengubah PIN admin Anda menggunakan OTP.',
      device: userAgent,
      ip,
    });

    await logAdminActivity(request, 'Admin PIN changed', {
      ip,
    }).catch((error) => {
      console.error('[Audit] Failed to log PIN change:', error);
    });

    // 7. Response Sukses
    return NextResponse.json({
      success: true,
      message: 'PIN admin berhasil diubah!',
    });
  } catch (error) {
    console.error('[API/Admin/Pin] Update failed:', error);
    return NextResponse.json({ error: 'Gagal mengubah PIN' }, { status: 500 });
  }
}
