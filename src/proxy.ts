import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured! Admin authentication will not work.');
}

// Protected routes (Admin Pages + Upload API)
const protectedRoutes = ['/admin', '/api/upload'];
const publicRoutes = ['/admin/login'];

// Rate limiting configuration (disabled in development to avoid local 429 spam)
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 1000; // Increase general limit
const RATE_LIMIT_STRICT_ENDPOINTS = {
    '/api/auth': 10,
    '/api/admin': 200,  // Increase admin rate limit
    '/api/projects': 500,  // Increase projects rate limit
    '/api/about': 500,  // Add about rate limit
    '/api/experience': 500,  // Add experience rate limit
    '/api/contact': 500,  // Increase contact rate limit
};

// Simple in-memory rate limiting (in production, use Redis).
// We also attach it to globalThis so the optional
// /api/admin/clear-rate-limit endpoint can access the same map in development.
const globalForRateLimit = globalThis as typeof globalThis & {
    __rateLimitMap?: Map<string, { count: number; resetTime: number }>;
};

const rateLimitMap =
    globalForRateLimit.__rateLimitMap ||
    new Map<string, { count: number; resetTime: number }>();

globalForRateLimit.__rateLimitMap = rateLimitMap;

function getRateLimitKey(request: NextRequest, endpoint?: string): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : (request as any).ip || 'unknown';
    return endpoint ? `${ip}:${endpoint}` : ip;
}

function checkRateLimit(
    key: string,
    maxRequests: number = RATE_LIMIT_MAX_REQUESTS
): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
        const resetTime = now + RATE_LIMIT_WINDOW;
        rateLimitMap.set(key, { count: 1, resetTime });
        return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    if (record.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

function isAPIRoute(pathname: string): boolean {
    return pathname.startsWith('/api/');
}

function isStaticAsset(pathname: string): boolean {
    return (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/static/') ||
        pathname.includes('.') // Files with extensions
    );
}

function addSecurityHeaders(response: NextResponse): NextResponse {
    const isProd = process.env.NODE_ENV === 'production';

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Only prevent framing in production; allow IDE preview iframe in dev
    if (isProd) {
        response.headers.set('X-Frame-Options', 'DENY');
    } else {
        // Remove any existing X-Frame-Options just in case
        response.headers.delete('X-Frame-Options');
    }
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Base CSP
    const cspBase = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live blob:",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https: http://localhost:* ws://localhost:* blob:",
        "media-src 'self' https: data:",
        "object-src 'none'",
        // Allow Vercel Live preview in development, block in production
        isProd ? "frame-src 'none'" : "frame-src 'self' https://vercel.live",
        // Allow being embedded in iframe during development to support preview
        isProd ? "frame-ancestors 'none'" : 'frame-ancestors *',
    ].join('; ') + ';';

    response.headers.set('Content-Security-Policy', cspBase);

    // HSTS (only in production)
    if (isProd) {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    return response;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isProd = process.env.NODE_ENV === 'production';

    // Skip middleware for static assets
    if (isStaticAsset(pathname)) {
        return NextResponse.next();
    }

    // 1. Authentication Check
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublic = publicRoutes.some(route => pathname.startsWith(route));

    if (isProtected && !isPublic) {
        const token =
            request.cookies.get('admin_token')?.value ||
            request.cookies.get('admin-token')?.value ||
            request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            // Check if it's an API call or Page visit
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }

        // Best-effort JWT shape and expiry check (signature is validated in server routes)
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid token format');
            }

            const payloadSegment = parts[1];
            const padded = payloadSegment.padEnd(
                payloadSegment.length + ((4 - (payloadSegment.length % 4)) % 4),
                '='
            );
            const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
            const json = atob(base64);
            const payload = JSON.parse(json) as { sub?: string; exp?: number };

            if (payload.sub !== 'admin') {
                throw new Error('Invalid subject');
            }

            if (typeof payload.exp === 'number') {
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp <= now) {
                    throw new Error('Token expired');
                }
            }
        } catch (error) {
            console.error('Admin token check failed in middleware:', error);
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Rate limiting for API routes (skip in development to avoid local throttling)
    if (isAPIRoute(pathname) && isProd) {
        // Check for specific endpoint limits
        const endpointLimit = Object.entries(RATE_LIMIT_STRICT_ENDPOINTS).find(
            ([endpoint]) => pathname.startsWith(endpoint)
        );

        const maxRequests = endpointLimit ? endpointLimit[1] : RATE_LIMIT_MAX_REQUESTS;
        const rateLimitKey = getRateLimitKey(request, endpointLimit?.[0]);
        const rateLimit = checkRateLimit(rateLimitKey, maxRequests);

        if (!rateLimit.allowed) {
            return new NextResponse(
                JSON.stringify({ error: 'Rate limit exceeded' }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RateLimit-Limit': maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
                    },
                }
            );
        }

        // Add rate limit headers to response
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

        return addSecurityHeaders(response);
    }

    // For non-API routes, just add security headers
    const response = NextResponse.next();
    return addSecurityHeaders(response);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - admin.html (static admin dashboard)
         */
        '/((?!_next/static|_next/image|favicon.ico|public/|admin\.html).*)',
    ],
};
