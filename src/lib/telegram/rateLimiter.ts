/**
 * Rate Limiter for Telegram Webhook
 * Prevents spam by limiting messages per chat
 *
 * Uses Firebase-backed rate limiting (see firebaseRateLimit.ts)
 * to ensure rate limits persist across serverless cold starts.
 *
 * The old in-memory Map approach was removed because it reset
 * on every cold start in Vercel's serverless environment.
 */

import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';

const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20; // Max 20 messages per minute per chat
const RATE_LIMIT_BLOCK = 5 * 60 * 1000; // Block for 5 minutes after exceeding limit

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
}

/**
 * Check rate limit for a given chatId using Firebase-backed storage.
 * This persists across cold starts unlike the old in-memory Map.
 */
export async function checkRateLimit(chatId: string): Promise<RateLimitResult> {
    // Sanitize chatId to prevent path traversal
    const safeChatId = String(chatId).replace(/[.#$/[\]]/g, '_');

    const result = await checkFirebaseRateLimit(
        `telegram_${safeChatId}`,
        RATE_LIMIT_MAX,
        RATE_LIMIT_WINDOW,
        RATE_LIMIT_BLOCK
    );

    return {
        allowed: result.allowed,
        remaining: result.allowed ? RATE_LIMIT_MAX - 1 : 0
    };
}
