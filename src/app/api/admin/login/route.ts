import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, getAdminToken } from '@/lib/auth';
import { sendTelegramAlert } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

type Attempt = { count: number; resetTime: number; blockedUntil?: number };

const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 menit
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_BLOCK_MS = 10 * 60 * 1000; // 10 menit blokir setelah gagal maksimal

const globalForLogin = globalThis as typeof globalThis & {
  __adminLoginAttempts?: Map<string, Attempt>;
};

const loginAttempts =
  globalForLogin.__adminLoginAttempts ||
  new Map<string, Attempt>();

globalForLogin.__adminLoginAttempts = loginAttempts;

function getClientKey(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  // Safely access .ip which might be missing in some Next.js type definitions but exists at runtime
  const requestIp = (request as unknown as { ip?: string }).ip;
  const ip = forwarded ? forwarded.split(',')[0] : requestIp || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  return `${ip}|${ua}`;
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
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  return `${os} • ${browser}`;
}

async function getGeoInfo(ipRaw: string) {
  // Extract pure IP if it contains port or UA (using pipe separator)
  const ip = ipRaw.split('|')[0];

  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return { location: 'Localhost', mapLink: '', isp: 'Local System' };
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,city,isp,lat,lon`);
    const data = await res.json();

    if (data.status === 'success') {
      const mapLink = `https://www.google.com/maps?q=${data.lat},${data.lon}`;
      return {
        location: `${data.city}, ${data.country}`,
        isp: data.isp,
        mapLink: mapLink
      };
    }
  } catch (e) {
    console.error('Geo lookup failed:', e);
  }
  return { location: 'Unknown', mapLink: '', isp: 'Unknown' };
}

function checkLoginAllowed(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (record?.blockedUntil && now < record.blockedUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

  if (!record || now > record.resetTime) {
    loginAttempts.set(key, { count: 0, resetTime: now + LOGIN_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    record.blockedUntil = now + LOGIN_BLOCK_MS;
    return {
      allowed: false,
      retryAfter: Math.ceil(LOGIN_BLOCK_MS / 1000),
    };
  }

  return { allowed: true };
}

function registerLoginFailure(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key) || {
    count: 0,
    resetTime: now + LOGIN_WINDOW_MS,
  };
  record.count += 1;

  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    record.blockedUntil = now + LOGIN_BLOCK_MS;
  }

  loginAttempts.set(key, record);
}

function registerLoginSuccess(key: string) {
  loginAttempts.delete(key);
}

export async function POST(request: NextRequest) {
  try {
    const clientKey = getClientKey(request);
    const loginAllowed = checkLoginAllowed(clientKey);

    if (!loginAllowed.allowed) {
      // Enrich with Geo Data
      const geo = await getGeoInfo(clientKey);
      const uaStr = clientKey.split('|')[1] || '';
      const device = parseUserAgent(uaStr);
      const mapLink = geo.mapLink ? `[Peta Lokasi](${geo.mapLink})` : 'Peta tidak tersedia';

      const message =
        `⚠️ **BLOCKED ATTEMPT** (Rate Limit)

💻 **Device:** ${device}
🌐 **Network:** ${geo.isp}
📡 **IP:** \`${clientKey.split('|')[0]}\`
📍 **Location:** ${geo.location}
🗺️ ${mapLink}

🕒 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

      // Fire and forget is risky in Serverless if not awaited, but for blocking it's ok if occasional miss. 
      // Better to await to ensure specific block notice goes out.
      await sendTelegramAlert(message);

      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        {
          status: 429,
          headers: loginAllowed.retryAfter
            ? { 'Retry-After': loginAllowed.retryAfter.toString() }
            : undefined,
        }
      );
    }

    const { password, lat, lng, accuracy } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    if (!verifyAdminPassword(password)) {
      const geo = await getGeoInfo(clientKey);
      const uaStr = clientKey.split('|')[1] || '';
      const device = parseUserAgent(uaStr);

      // Use GPS if available, otherwise IP location
      const locationName = (lat && lng) ? `GPS Coordinates` : geo.location;

      // Map Link: Prefer GPS High Precision
      let topMapLink = geo.mapLink;
      if (lat && lng) {
        topMapLink = `https://www.google.com/maps?q=${lat},${lng}`;
      }

      const mapLink = topMapLink ? `[Peta Lokasi](${topMapLink})` : 'Peta tidak tersedia';
      const accStr = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
      const sourceInfo = (lat && lng) ? `(GPS Akurat${accStr})` : `(Estimasi IP)`;

      const message =
        `🚫 **LOGIN FAILED** (Salah Password)

💻 **Device:** ${device}
🌐 **Network:** ${geo.isp}
📡 **IP:** \`${clientKey.split('|')[0]}\`
📍 **Location:** ${locationName} ${sourceInfo}
🗺️ ${mapLink}

🕒 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

      await sendTelegramAlert(message);

      registerLoginFailure(clientKey);
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    registerLoginSuccess(clientKey);

    const geo = await getGeoInfo(clientKey);

    // GPS Logic for Success
    const uaStr = clientKey.split('|')[1] || '';
    const device = parseUserAgent(uaStr);

    // GPS Logic for Success
    const locationName = (lat && lng) ? `GPS Coordinates` : geo.location;
    let topMapLink = geo.mapLink;
    if (lat && lng) {
      topMapLink = `https://www.google.com/maps?q=${lat},${lng}`;
    }

    const mapLink = topMapLink ? `[Peta Lokasi](${topMapLink})` : 'Peta tidak tersedia';
    const accStr = accuracy ? ` (±${Math.round(accuracy)}m)` : '';
    const sourceInfo = (lat && lng) ? `(GPS Akurat${accStr})` : `(Estimasi IP)`;

    const successMessage =
      `✅ **LOGIN SUCCESS**

💻 **Device:** ${device}
🌐 **Network:** ${geo.isp}
📡 **IP:** \`${clientKey.split('|')[0]}\`
📍 **Location:** ${locationName} ${sourceInfo}
🗺️ ${mapLink}

🕒 ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`;

    await sendTelegramAlert(successMessage);

    const token = getAdminToken();

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    };

    // Canonical cookie name for admin session
    response.cookies.set('admin_token', token, cookieOptions);
    // Backwards compatibility with old name (can be removed later)
    response.cookies.set('admin-token', token, cookieOptions);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
