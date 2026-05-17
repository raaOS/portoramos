import 'server-only';
import { db } from '@/lib/database';

interface RateLimitRecord {
    attempts: number;
    resetAt: number;
    blockedUntil?: number;
}

export async function checkDataRateLimit(
    key: string,
    maxAttempts: number,
    windowMs: number,
    blockMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const safePath = key.replace(/[.#$/[\]]/g, '_');
    const ref = db.ref(`rateLimits/${safePath}`);

    try {
        await ref.transaction((record: RateLimitRecord | null) => {
            if (!record) {
                return { attempts: 1, resetAt: now + windowMs };
            }

            if (record.blockedUntil && now < record.blockedUntil) {
                return record;
            }

            if (now > record.resetAt || (record.blockedUntil && now >= record.blockedUntil)) {
                return { attempts: 1, resetAt: now + windowMs };
            }

            if (record.attempts >= maxAttempts) {
                return { ...record, blockedUntil: now + blockMs };
            }

            return { ...record, attempts: record.attempts + 1 };
        });

        const finalSnap = await ref.once('value');
        const finalRecord: RateLimitRecord | null = finalSnap.val();

        if (finalRecord?.blockedUntil && now < finalRecord.blockedUntil) {
            return {
                allowed: false,
                retryAfter: Math.ceil((finalRecord.blockedUntil - now) / 1000),
            };
        }

        return { allowed: true };
    } catch (error) {
        console.error('[RateLimit] Transaction failed:', error);
        return { allowed: true };
    }
}
