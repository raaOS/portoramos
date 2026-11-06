/**
 * Chat visitor session — signed visitorId (HMAC-SHA256).
 *
 * Mencegah IDOR pada /api/chat/* : client tidak bisa membaca/menghapus
 * riwayat orang lain hanya dengan menebak visitorId, karena setiap request
 * wajib menyertakan signature yang hanya bisa dibuat server.
 *
 * Format token: `${visitorId}.${hexSig}`
 */
import 'server-only';
import crypto from 'crypto';
import { cleanEnvVar } from '@/lib/utils/env';

function getSecret(): string | null {
  const secret = cleanEnvVar('JWT_SECRET');
  return secret || null;
}

function hmac(visitorId: string): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return crypto.createHmac('sha256', secret).update(`chat-visitor:${visitorId}`).digest('hex');
}

export function signVisitorId(visitorId: string): string {
  if (!visitorId || typeof visitorId !== 'string') {
    throw new Error('visitorId is required');
  }
  return hmac(visitorId);
}

export function verifyVisitorSession(visitorId: unknown, signature: unknown): boolean {
  if (typeof visitorId !== 'string' || !visitorId) return false;
  if (typeof signature !== 'string' || !signature) return false;

  let expected: string;
  try {
    expected = hmac(visitorId);
  } catch {
    return false;
  }

  const a = Buffer.from(signature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function issueVisitorSession(): { visitorId: string; signature: string } {
  const visitorId = crypto.randomUUID();
  return { visitorId, signature: signVisitorId(visitorId) };
}

export function isSignedVisitorIdFormat(token: string): boolean {
  const idx = token.lastIndexOf('.');
  return idx > 0 && idx < token.length - 1;
}
