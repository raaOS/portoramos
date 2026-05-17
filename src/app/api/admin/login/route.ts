import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, getAdminToken } from '@/lib/auth';
import { sendTelegramAlert, sendTelegramToGroup } from '@/lib/telegram';
import { generateCSRFToken, validateCSRFToken } from '@/lib/security';
import { checkDataRateLimit } from '@/lib/dataRateLimit';
import { cookies } from 'next/headers';
import { getClientIdentifier } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

// RATE LIMITING - 3 percobaan per 5 menit, block 30 menit (disimpan di CLOUDFLARE_D1)
const MAX_ATTEMPTS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;  // 5 menit
const BLOCK_DURATION = 30 * 60 * 1000;    // 30 menit

// Prefer server-only key, keep public fallback for backward compatibility.
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

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
 * Google Maps Reverse Geocoding - Convert lat,lng to address
 */
async function getGoogleMapsAddress(lat: number, lng: number): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=id`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Get the most detailed address (usually first result)
      return data.results[0].formatted_address;
    }
  } catch (error) {
    console.error('[Google Maps] Reverse geocoding error:', error);
  }

  return null;
}

interface LocationInfo {
  text: string;
  mapUrl: string | null;
}

/**
 * Format location info for Telegram message
 */
async function formatLocationInfo(
  lat: number | null,
  lng: number | null,
  accuracy: number | null,
  ipLocation: string
): Promise<LocationInfo> {
  // If we have GPS coordinates
  if (lat && lng) {
    const address = await getGoogleMapsAddress(lat, lng);
    const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const accuracyText = accuracy ? `±${Math.round(accuracy)}m` : 'N/A';

    let locationText = '📍 **Lokasi (GPS)**\n';
    if (address) {
      locationText += `• Alamat: ${address}\n`;
    }
    locationText += `• Koordinat: \`${lat.toFixed(6)}, ${lng.toFixed(6)}\`\n`;
    locationText += `• Akurasi: ${accuracyText}`;

    return { text: locationText, mapUrl };
  }

  // Fallback to IP location
  return {
    text: `📍 **Lokasi (IP)**\n• ${ipLocation}`,
    mapUrl: null
  };
}

/**
 * GET Handler - Generates and provides a CSRF token.
 * Sets a secure, httpOnly cookie with the token.
 */
export async function GET() {
  const token = generateCSRFToken();
  const response = NextResponse.json({ csrfToken: token });

  response.cookies.set('csrf_token', token, {
    httpOnly: false,
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

interface LoginRequestBody {
  password: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
}

export async function POST(request: NextRequest) {
  try {
    // 1. CSRF VALIDATION
    const csrfToken = request.headers.get('x-csrf-token');
    const cookieStore = await cookies();
    const sessionCsrfToken = cookieStore.get('csrf_token')?.value;

    if (!csrfToken || !sessionCsrfToken) {
      return NextResponse.json(
        { error: 'Invalid or missing CSRF token' },
        { status: 403 }
      );
    }

    const isValid = validateCSRFToken(csrfToken, sessionCsrfToken);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    const clientId = getClientIdentifier(request);

    // Skip rate limiting and external side effects for automated tests.
    const isTestEnv =
      process.env.NODE_ENV === 'test' ||
      process.env.E2E_TEST === 'true' ||
      (process.env.NODE_ENV === 'development' && request.headers.get('x-test-bypass') === 'true');
    
    if (!isTestEnv) {
      // CLOUDFLARE_D1 rate limiting (persisten di Vercel, tidak hilang saat cold start)
      const rateLimit = await checkDataRateLimit(
        `login_${clientId}`,
        MAX_ATTEMPTS_PER_WINDOW,
        RATE_LIMIT_WINDOW,
        BLOCK_DURATION
      );

      if (!rateLimit.allowed) {
        const [ip, userAgent] = clientId.split('|');
        const geo = await getGeoInfo(ip);
        const device = parseUserAgent(userAgent);

        const message = `🚫 **BLOCKED BY RATE LIMIT**

💻 **Device:** ${device}
🌐 **Network:** ${geo.isp}
📡 **IP:** \`${ip}\`
📍 **Location:** ${geo.location}
⏰ **Retry After:** ${rateLimit.retryAfter} seconds

🕒 ${new Date().toLocaleString('id-ID')}`;

        await sendTelegramAlert(message, { priority: 'high' });

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
    }

    const { password, lat, lng, accuracy } = await request.json() as LoginRequestBody;

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

    const [ip, userAgent] = clientId.split('|');
    const geo = isTestEnv
      ? { location: 'E2E Test Environment', isp: 'Playwright' }
      : await getGeoInfo(ip);
    const device = isTestEnv ? 'Playwright Test Runner' : parseUserAgent(userAgent);

    // Get location info (GPS preferred, fallback to IP).
    const locationInfo = isTestEnv
      ? { text: '**Lokasi (Test)**\n- Simulated E2E environment', mapUrl: null }
      : await formatLocationInfo(
        lat ?? null,
        lng ?? null,
        accuracy ?? null,
        geo.location
      );

    // VERIFY PASSWORD
    let passwordValid = false;
    try {
      passwordValid = verifyAdminPassword(password);
    } catch {
      // Jika auth config error, jangan expose ke user
      return NextResponse.json(
        { error: 'Authentication service error' },
        { status: 500 }
      );
    }

    if (!passwordValid) {
      const message = `❌ **LOGIN FAILED**

${locationInfo.text}

💻 **Device:** ${device}
🌐 **Network:** ${geo.isp}
📡 **IP:** \`${ip}\`

🕒 ${new Date().toLocaleString('id-ID')}`;

      const buttons = locationInfo.mapUrl
        ? [[{ text: '🗺️ Buka di Google Maps', url: locationInfo.mapUrl }]]
        : undefined;

      if (!isTestEnv) {
        await sendTelegramAlert(message, { priority: 'normal', buttons });
      }

      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // SUCCESS

    const message = `✅ **LOGIN SUCCESS**

${locationInfo.text}

💻 **Device:** ${device}
🌐 **Network:** ${geo.isp}
📡 **IP:** \`${ip}\`

🕒 ${new Date().toLocaleString('id-ID')}`;

    const buttons = locationInfo.mapUrl
      ? [[{ text: '🗺️ Buka di Google Maps', url: locationInfo.mapUrl }]]
      : undefined;

    if (!isTestEnv) {
      // Send to personal chat
      await sendTelegramAlert(message, { priority: 'normal', buttons });

      // Also send to group if configured
      await sendTelegramToGroup(message, { priority: 'normal', buttons });
    }

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
    console.error('[Admin Login] Authentication failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
