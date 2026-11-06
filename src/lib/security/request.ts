import type { NextRequest } from 'next/server';
import { checkDataRateLimit } from '@/lib/dataRateLimit';
import {
  CLOUDFLARE_CONNECTING_IP_HEADER,
  UNKNOWN_IP,
  VERCEL_FORWARDED_FOR_HEADER,
} from '@/lib/security/constants';

/**
 * Get client IP address from request
 *
 * SECURITY: Only trust headers set by trusted proxies/CDN.
 * - x-vercel-forwarded-for: Set by Vercel's edge network (trusted)
 * - cf-connecting-ip: Set by Cloudflare when proxying (trusted when using Cloudflare proxy)
 *
 * Headers like x-forwarded-for and x-real-ip are client-spoofable
 * and should NOT be trusted for rate limiting decisions.
 */
export function getClientIP(request: Request | NextRequest): string {
  // Vercel sets this header - cannot be spoofed from client
  const vercelIP = request.headers.get(VERCEL_FORWARDED_FOR_HEADER);
  if (vercelIP) {
    return vercelIP.split(',')[0].trim();
  }

  // Cloudflare proxy IP (trusted when using Cloudflare)
  const cfIP = request.headers.get(CLOUDFLARE_CONNECTING_IP_HEADER);
  if (cfIP) {
    return cfIP.trim();
  }

  // SECURITY: Never trust X-Forwarded-For / X-Real-IP for rate-limit identity.
  // On Vercel/Cloudflare the trusted headers above are always present; falling
  // back to client-controlled headers would allow rate-limit spoofing on any
  // other host (dev tunnel, self-host, misconfigured proxy).
  return UNKNOWN_IP;
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
  return checkDataRateLimit(getClientIdentifier(request, scope), maxAttempts, windowMs, blockMs);
}
