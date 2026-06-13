/**
 * Data Rate Limit — Persistent rate limiter berbasis D1.
 *
 * Menggunakan Cloudflare D1 sebagai backend pencatat request count per identifier.
 * Fallback ke in-memory Map jika D1 tidak tersedia (misalnya di unit test).
 *
 * @module dataRateLimit
 */
import 'server-only';
import { isD1Configured } from '@/lib/cloudflareD1';
import { db } from '@/lib/database';

interface RateLimitRecord {
  attempts: number;
  resetAt: number;
  blockedUntil?: number;
}

const localLimits = new Map<string, RateLimitRecord>();

// Cleanup interval: evict expired entries every 5 minutes to prevent
// unbounded memory growth in long-running processes or during D1 outages.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of localLimits) {
    if (now > record.resetAt && (!record.blockedUntil || now >= record.blockedUntil)) {
      localLimits.delete(key);
    }
  }
}

function checkLocalRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  blockMs: number
): { allowed: boolean; retryAfter?: number } {
  cleanupExpiredEntries();
  const now = Date.now();
  const record = localLimits.get(key);

  if (!record || now > record.resetAt || (record.blockedUntil && now >= record.blockedUntil)) {
    localLimits.set(key, { attempts: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.blockedUntil && now < record.blockedUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

  if (record.attempts >= maxAttempts) {
    const blockedUntil = now + blockMs;
    localLimits.set(key, { ...record, blockedUntil });
    return {
      allowed: false,
      retryAfter: Math.ceil(blockMs / 1000),
    };
  }

  localLimits.set(key, { ...record, attempts: record.attempts + 1 });
  return { allowed: true };
}

export async function checkDataRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  blockMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const safePath = key.replace(/[.#$/[\]]/g, '_');

  if (!isD1Configured()) {
    return checkLocalRateLimit(safePath, maxAttempts, windowMs, blockMs);
  }

  const ref = db.ref(`rateLimits/${safePath}`);

  try {
    // Capture the decision inside the transaction callback to avoid
    // a TOCTOU race between the transaction commit and a separate read.
    let decision: { allowed: boolean; retryAfter?: number } = { allowed: false };

    await ref.transaction((record: RateLimitRecord | null) => {
      if (!record) {
        decision = { allowed: true };
        return { attempts: 1, resetAt: now + windowMs };
      }

      if (record.blockedUntil && now < record.blockedUntil) {
        decision = {
          allowed: false,
          retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
        };
        return record;
      }

      if (now > record.resetAt || (record.blockedUntil && now >= record.blockedUntil)) {
        decision = { allowed: true };
        return { attempts: 1, resetAt: now + windowMs };
      }

      if (record.attempts >= maxAttempts) {
        const blockedUntil = now + blockMs;
        decision = {
          allowed: false,
          retryAfter: Math.ceil(blockMs / 1000),
        };
        return { ...record, blockedUntil };
      }

      decision = { allowed: true };
      return { ...record, attempts: record.attempts + 1 };
    });

    return decision;
  } catch (error) {
    console.error('[RateLimit] Transaction failed:', error);
    // Fail-closed in production: block the request when D1 is unreachable
    // to prevent attackers from bypassing rate limits by triggering errors.
    // In test/dev, fallback to local limiter for convenience.
    if (process.env.NODE_ENV === 'production') {
      return { allowed: false, retryAfter: 60 };
    }
    return checkLocalRateLimit(safePath, maxAttempts, windowMs, blockMs);
  }
}
