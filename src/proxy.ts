/**
 * 🚨 ATURAN EMAS - JANGAN DIHAPUS / JANGAN DIGANTI NAMA 🚨
 * 
 * JANGAN PERNAH mengganti nama file ini menjadi 'middleware.ts'.
 * Project ini menggunakan Next.js 16/Kustom yang mewajibkan konvensi 'proxy.ts'.
 * Mengubahnya ke 'middleware.ts' akan merusak sistem dan memicu peringatan deprecation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMIT_STRICT_ENDPOINTS, RATE_LIMIT_MAX_REQUESTS } from './middleware/constants';
import { isAPIRoute, isStaticAsset, getRateLimitKey, checkRateLimit, addSecurityHeaders } from './middleware/utils';
import { checkAdminAuth } from './middleware/auth';
import { checkCSRF } from './middleware/csrf';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isProd = process.env.NODE_ENV === 'production';

    // Skip middleware for static assets
    if (isStaticAsset(pathname)) {
        return NextResponse.next();
    }

    // 0. CSRF Protection for Mutations
    const csrfResult = checkCSRF(request);
    if (!csrfResult.isValid && csrfResult.response) {
        return csrfResult.response;
    }

    // 1. Authentication Check
    const authResult = checkAdminAuth(request);
    if (!authResult.authenticated && authResult.response) {
        return authResult.response;
    }

    // 2. Rate limiting for API routes (skip in development)
    if (isAPIRoute(pathname) && isProd) {
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

        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());

        return addSecurityHeaders(response);
    }

    // For non-API routes or dev API routes, just add security headers
    const response = NextResponse.next();
    return addSecurityHeaders(response);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|public/|admin\\.html).*)',
    ],
};
