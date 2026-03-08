/**
 * Firebase-backed Rate Limiter
 * Pengganti in-memory rate limiter yang hilang saat cold start Vercel.
 * Menyimpan data di Firebase Realtime Database (/rateLimits/{key}).
 * 
 * FIXED (BUG-005): Menggunakan transaction untuk atomic read-modify-write
 * menghindari race condition saat concurrent requests.
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

    try {
        // FIXED: Gunakan transaction untuk atomic operation
        await ref.transaction((record: RateLimitRecord | null) => {
            // Jika record tidak ada, buat baru
            if (!record) {
                return { attempts: 1, resetAt: now + windowMs };
            }

            // Jika sedang diblock
            if (record.blockedUntil && now < record.blockedUntil) {
                // Return same record (no change), akan handle di luar
                return record;
            }

            // Reset jika window sudah lewat atau block sudah habis
            if (now > record.resetAt || (record.blockedUntil && now >= record.blockedUntil)) {
                return { attempts: 1, resetAt: now + windowMs };
            }

            // Block jika melebihi limit
            if (record.attempts >= maxAttempts) {
                return { ...record, blockedUntil: now + blockMs };
            }

            // Tambah hitungan
            return { ...record, attempts: record.attempts + 1 };
        });

        // Get final record setelah transaction
        const finalSnap = await ref.once('value');
        const finalRecord: RateLimitRecord = finalSnap.val();

        // Determine result berdasarkan final state
        if (finalRecord.blockedUntil && now < finalRecord.blockedUntil) {
            return { 
                allowed: false, 
                retryAfter: Math.ceil((finalRecord.blockedUntil - now) / 1000) 
            };
        }

        return { allowed: true };
    } catch (error) {
        // Jika transaction gagal, allow request untuk menghindari blocking legitimate users
        console.error('[RateLimit] Transaction failed:', error);
        return { allowed: true };
    }
}
