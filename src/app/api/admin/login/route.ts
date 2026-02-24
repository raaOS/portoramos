import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, getAdminToken } from '@/lib/auth';
import { sendTelegramAlert } from '@/lib/telegram';
import { generateCSRFToken, validateCSRFToken } from '@/lib/security';
import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// RATE LIMITING - 3 percobaan per 5 menit, block 30 menit (disimpan di Firebase)
const MAX_ATTEMPTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;  // 5 menit
const BLOCK_DURATION = 30 * 60 * 1000;    // 30 menit

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}|${userAgent}`;
}

function parseUserAgent(ua: string) {
  let os = 'Unknown OS';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'MacOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  let browser = 'Unknown Browser';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  return `${os} • ${browser}`;
}

async function getGeoInfo(ip: string) {
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return { location: 'Localhost', isp: 'Local System' };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`);
    const data = await res.json();

    if (data.status === 'success') {
      return {
        location: `${data.city}, ${data.country}`,
        isp: data.isp
      };
    }
  } catch {
    // Silent fail untuk geo lookup
  }

  return { location: 'Unknown', isp: 'Unknown' };
}

/**
 * GET Handler - Generates and provides a CSRF token.
 * Sets a secure, httpOnly cookie with the token.
 */
export async function GET() {
  const token = generateCSRFToken();
  const response = NextResponse.json({ csrfToken: token });

  response.cookies.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600, // 1 hour
    path: '/'
  });

  // Prevent browser caching of CSRF token
  response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export async function POST(request: NextRequest) {
  try {
    // 1. CSRF VALIDATION
    const csrfToken = request.headers.get('x-csrf-token');
    const cookieStore = await cookies();

    const sessionCsrfToken = cookieStore.get('csrf_token')?.value;

    if (!csrfToken || !sessionCsrfToken || !validateCSRFToken(csrfToken, sessionCsrfToken)) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    const clientId = getClientIdentifier(request);

    // Firebase rate limiting (persisten di Vercel, tidak hilang saat cold start)
    const rateLimit = await checkFirebaseRateLimit(
      `login_${clientId}`,
      MAX_ATTEMPTS_PER_WINDOW,
      RATE_LIMIT_WINDOW,
      BLOCK_DURATION
    );

    if (!rateLimit.allowed) {
      const [ip, userAgent] = clientId.split('|');
      const geo = await getGeoInfo(ip);
      const device = parseUserAgent(userAgent);

      await sendTelegramAlert(
        `🚫 **BLOCKED BY RATE LIMIT**

💻 **Device:** ${device}
🌐 **Network:** ${geo.isp}
📡 **IP:** \`${ip}\`
📍 **Location:** ${geo.location}
⏰ **Retry After:** ${rateLimit.retryAfter} seconds

🕒 ${new Date().toLocaleString('id-ID')}`,
        { priority: 'high' }
      );

      return NextResponse.json(
        {
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter) }
        }
      );
    }

    const { password, lat, lng } = await request.json();

    // VALIDASI INPUT STRICT
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // VERIFY PASSWORD
    let isValid = false;
    try {
      isValid = verifyAdminPassword(password);
    } catch (error) {
      // Jika auth config error, jangan expose ke user
      return NextResponse.json(
        { error: 'Authentication service error' },
        { status: 500 }
      );
    }

    if (!isValid) {
      const [ip, userAgent] = clientId.split('|');
      const geo = await getGeoInfo(ip);
      const device = parseUserAgent(userAgent);

      await sendTelegramAlert(
        `❌ **LOGIN FAILED**

💻 **Device:** ${device}
🌐 **Network:** ${geo.isp}
📡 **IP:** \`${ip}\`
📍 **Location:** ${geo.location}

🕒 ${new Date().toLocaleString('id-ID')}`,
        { priority: 'normal' }
      );

      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // SUCCESS

    const [ip, userAgent] = clientId.split('|');
    const geo = await getGeoInfo(ip);
    const device = parseUserAgent(userAgent);

    await sendTelegramAlert(
      `✅ **LOGIN SUCCESS**

💻 **Device:** ${device}
🌐 **Network:** ${geo.isp}
📡 **IP:** \`${ip}\`
📍 **Location:** ${geo.location}

🕒 ${new Date().toLocaleString('id-ID')}`,
      { priority: 'normal' }
    );

    const token = getAdminToken();

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    // SECURE COOKIE SETTINGS
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 2 * 60 * 60, // 2 jam (sesuai JWT expiry)
      path: '/'
      // Hapus domain untuk kompatibilitas Vercel
    });

    return response;

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Authentication failed', details: msg },
      { status: 500 }
    );
  }
}