import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, getAdminToken } from '@/lib/auth';
import { sendTelegramAlert } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

// RATE LIMITING CONFIGURATION - STRICT!
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 menit
const MAX_ATTEMPTS_PER_WINDOW = 3; // Hanya 3 percobaan
const BLOCK_DURATION = 30 * 60 * 1000; // 30 menit block

// Global rate limiting storage
const globalRateLimit = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, { attempts: number; resetAt: number; blockedUntil?: number }>;
};

const rateLimitStore = globalRateLimit.__rateLimitStore || new Map();
globalRateLimit.__rateLimitStore = rateLimitStore;

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}|${userAgent}`;
}

function checkRateLimit(clientId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  // Jika sedang diblock
  if (record?.blockedUntil && now < record.blockedUntil) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000) 
    };
  }

  // Reset jika window sudah lewat
  if (!record || now > record.resetAt) {
    rateLimitStore.set(clientId, {
      attempts: 0,
      resetAt: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true };
  }

  // Block jika sudah max attempts
  if (record.attempts >= MAX_ATTEMPTS_PER_WINDOW) {
    record.blockedUntil = now + BLOCK_DURATION;
    return { 
      allowed: false, 
      retryAfter: Math.ceil(BLOCK_DURATION / 1000) 
    };
  }

  return { allowed: true };
}

function incrementAttempts(clientId: string): void {
  const record = rateLimitStore.get(clientId);
  if (record) {
    record.attempts += 1;
  }
}

function clearAttempts(clientId: string): void {
  rateLimitStore.delete(clientId);
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

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId);

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
      incrementAttempts(clientId);
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
      incrementAttempts(clientId);

      const [ip, userAgent] = clientId.split('|');
      const geo = await getGeoInfo(ip);
      const device = parseUserAgent(userAgent);

      const remainingAttempts = MAX_ATTEMPTS_PER_WINDOW - (rateLimitStore.get(clientId)?.attempts || 0);

      await sendTelegramAlert(
        `❌ **LOGIN FAILED**

💻 **Device:** ${device}
🌐 **Network:** ${geo.isp}
📡 **IP:** \`${ip}\`
📍 **Location:** ${geo.location}
🎯 **Remaining Attempts:** ${remainingAttempts}

🕒 ${new Date().toLocaleString('id-ID')}`,
        { priority: remainingAttempts <= 1 ? 'high' : 'normal' }
      );

      return NextResponse.json(
        { 
          error: 'Invalid password',
          remainingAttempts: Math.max(0, remainingAttempts)
        }, 
        { status: 401 }
      );
    }

    // SUCCESS - Clear attempts & issue token
    clearAttempts(clientId);

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
      sameSite: 'strict',
      maxAge: 2 * 60 * 60, // 2 jam (sesuai JWT expiry)
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.ramos.my.id' : undefined
    });

    return response;

  } catch (error) {
    // Generic error - jangan expose detail
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}