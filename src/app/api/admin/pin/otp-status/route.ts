import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Validasi Auth & CSRF (Untuk GET tidak wajib CSRF)
    const isValid = await validateAdminRequest(request, { checkCsrf: false });
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Baca dari D1
    const otpSnap = await db.ref('settings/adminPinOtp').once('value');
    const otpData = otpSnap.val();

    if (
      !otpData ||
      typeof otpData !== 'object' ||
      otpData.purpose !== 'pin' ||
      !otpData.status ||
      !otpData.expiresAt
    ) {
      return NextResponse.json({ status: 'expired' });
    }

    // Cek kadaluarsa
    if (Date.now() > otpData.expiresAt) {
      await db.ref('settings/adminPinOtp').remove();
      return NextResponse.json({ status: 'expired' });
    }

    return NextResponse.json({ status: otpData.status });
  } catch (error) {
    console.error('[API/Admin/Pin/OTP-Status] Check failed:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
