import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMIT_WINDOW, RATE_LIMIT_MAX_REQUESTS } from './constants';

export function isAPIRoute(pathname: string): boolean {
    return pathname.startsWith('/api/');
}

export function isStaticAsset(pathname: string): boolean {
    return (pathname.startsWith('/_next/') ||
        pathname.startsWith('/static/') || /\.(ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|woff2?|ttf|eot|mp4|webm|wav|mp3|json|xml|txt|map)$/i.test(pathname));
}

export function getRateLimitKey(request: NextRequest, endpoint?: string): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : (request as NextRequest & { ip?: string }).ip || 'unknown';
    return endpoint ? `${ip}:${endpoint}` : ip;
}

const globalForRateLimit = globalThis as typeof globalThis & {
    __rateLimitMap?: Map<string, { count: number; resetTime: number }>;
};

const rateLimitMap =
    globalForRateLimit.__rateLimitMap ||
    new Map<string, { count: number; resetTime: number }>();

globalForRateLimit.__rateLimitMap = rateLimitMap;

export function checkRateLimit(
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

export function addSecurityHeaders(response: NextResponse): NextResponse {
    const isProd = process.env.NODE_ENV === 'production';

    response.headers.set('X-Content-Type-Options', 'nosniff');
    if (isProd) {
        response.headers.set('X-Frame-Options', 'DENY');
    } else {
        response.headers.delete('X-Frame-Options');
    }
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    const cspBase = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com blob:",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https: http://localhost:* ws://localhost:* https://va.vercel-scripts.com blob:",
        "media-src 'self' https: data: blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        isProd ? "frame-src 'none'" : "frame-src 'self' https://vercel.live",
        isProd ? "frame-ancestors 'none'" : 'frame-ancestors *',
    ].join('; ') + ';';

    response.headers.set('Content-Security-Policy', cspBase);

    if (isProd) {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    return response;
}
