/**
 * Firebase-backed Rate Limiter
 * Pengganti in-memory rate limiter yang hilang saat cold start Vercel.
 * Menyimpan data di Firebase Realtime Database (/rateLimits/{key}).
 */
import 'server-only';
import { db } from '@/lib/firebaseAdmin';

interface RateLimitRecord {
    attempts: number;
    resetAt: number;
    blockedUntil?: number;
}

/**
 * Cek apakah request dari key (IP|UserAgent) diizinkan.
 * @param key - Identifier unik (misal: "ip|userAgent")
 * @param maxAttempts - Maks percobaan per window
 * @param windowMs - Durasi window dalam ms
 * @param blockMs - Durasi block jika melebihi limit dalam ms
 */
export async function checkFirebaseRateLimit(
    key: string,
    maxAttempts: number,
    windowMs: number,
    blockMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const safePath = key.replace(/[.#$/[\]]/g, '_');
    const ref = db.ref(`rateLimits/${safePath}`);

    const snap = await ref.once('value');
    const record: RateLimitRecord = snap.exists()
        ? snap.val()
        : { attempts: 0, resetAt: now + windowMs };

    // Jika sedang diblock
    if (record.blockedUntil && now < record.blockedUntil) {
        return { allowed: false, retryAfter: Math.ceil((record.blockedUntil - now) / 1000) };
    }

    // Reset jika window sudah lewat atau block sudah habis
    if (now > record.resetAt || (record.blockedUntil && now >= record.blockedUntil)) {
        const newRecord: RateLimitRecord = { attempts: 1, resetAt: now + windowMs };
        await ref.set(newRecord);
        return { allowed: true };
    }

    // Block jika melebihi limit
    if (record.attempts >= maxAttempts) {
        const blocked: RateLimitRecord = { ...record, blockedUntil: now + blockMs };
        await ref.set(blocked);
        return { allowed: false, retryAfter: Math.ceil(blockMs / 1000) };
    }

    // Tambah hitungan
    const updated: RateLimitRecord = { ...record, attempts: record.attempts + 1 };
    await ref.set(updated);
    return { allowed: true };
}
