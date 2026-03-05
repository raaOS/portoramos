/**
 * Rate Limiter for Telegram Webhook
 * Prevents spam by limiting messages per chat
 */

// Simple in-memory rate limiter (anti-spam)
// Production: consider using Redis for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20; // Max 20 messages per minute per chat

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
}

export function checkRateLimit(chatId: string): RateLimitResult {
    const now = Date.now();
    const record = rateLimitMap.get(chatId);
    
    if (!record || now > record.resetTime) {
        // Reset window
        rateLimitMap.set(chatId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }
    
    if (record.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0 };
    }
    
    record.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

// Cleanup old entries periodically (optional, prevents memory leak)
export function cleanupRateLimit(): void {
    const now = Date.now();
    for (const [chatId, record] of rateLimitMap.entries()) {
        if (now > record.resetTime) {
            rateLimitMap.delete(chatId);
        }
    }
}

// Run cleanup every 5 minutes
if (typeof global !== 'undefined') {
    setInterval(cleanupRateLimit, 5 * 60 * 1000);
}
