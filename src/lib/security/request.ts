import type { NextRequest } from 'next/server';
import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';

export function getClientIP(request: Request | NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfIP = request.headers.get('cf-connecting-ip');

    if (cfIP) return cfIP.trim();
    if (realIP) return realIP.trim();
    if (forwarded) return forwarded.split(',')[0].trim();

    return 'unknown';
}

export function getClientIdentifier(request: Request | NextRequest, scope?: string): string {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const baseIdentifier = `${ip}|${userAgent}`;

    return scope ? `${scope}:${baseIdentifier}` : baseIdentifier;
}

export async function enforceRequestRateLimit(
    request: Request | NextRequest,
    scope: string,
    maxAttempts: number,
    windowMs: number,
    blockMs: number
) {
    return checkFirebaseRateLimit(
        getClientIdentifier(request, scope),
        maxAttempts,
        windowMs,
        blockMs
    );
}
