import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db } from '@/lib/database';
import { hashPasswordScrypt } from '@/lib/auth';
import { enforceRequestRateLimit } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function getFallbackAdminPin() {
  const pin = process.env.ADMIN_PIN?.trim();
  return pin && /^\d{4}$/.test(pin) ? pin : '2101';
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting to prevent brute-forcing
    const rateLimit = await enforceRequestRateLimit(
      request,
      'pin_verify',
      5, // max 5 attempts
      60 * 1000, // 1 minute window
      15 * 60 * 1000 // 15 minutes block
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    // 2. Parse Body
    const body = await request.json();
    const { pin } = body;

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN wajib diisi' }, { status: 400 });
    }

    const salt = process.env.PASSWORD_SALT;
    if (!salt) {
      return NextResponse.json(
        { error: 'Konfigurasi PASSWORD_SALT tidak ditemukan' },
        { status: 500 }
      );
    }

    // 3. Get target PIN or Hash
    let isValid = false;
    try {
      const dbHashSnap = await db.ref('settings/adminPin').once('value');
      const dbHash = dbHashSnap.val();

      if (dbHash && typeof dbHash === 'string') {
        const hashedInput = hashPasswordScrypt(pin, salt);
        isValid = timingSafeEqualString(hashedInput, dbHash);
      } else {
        // Fallback PIN is server-only and only gates navigation to /admin/login.
        const fallbackPin = getFallbackAdminPin();
        isValid = timingSafeEqualString(pin, fallbackPin);
      }
    } catch (dbError) {
      console.error('[PIN Verify] DB read failed, falling back to ENV:', dbError);
      const fallbackPin = getFallbackAdminPin();
      isValid = timingSafeEqualString(pin, fallbackPin);
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'PIN salah' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/Admin/Pin/Verify] Verification failed:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
