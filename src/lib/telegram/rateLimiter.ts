/**
 * Rate Limiter for Telegram Webhook
 * Prevents spam by limiting messages per chat
 * 
 * FIXED (BUG-004): Proper interval management dengan start/stop functions
 * untuk menghindari memory leak dan multiple intervals di serverless environment.
 */

// Simple in-memory rate limiter (anti-spam)
// Production: consider using Redis for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20; // Max 20 messages per minute per chat

// FIXED: Track cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;
let isCleanupStarted = false;

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

// FIXED (BUG-004): Start cleanup interval dengan proper singleton pattern
export function startRateLimitCleanup(): void {
    if (isCleanupStarted || cleanupInterval !== null) {
        return; // Already started
    }
    
    isCleanupStarted = true;
    cleanupInterval = setInterval(cleanupRateLimit, 5 * 60 * 1000);
    
    // Cleanup on process exit (Node.js environment)
    if (typeof process !== 'undefined') {
        process.on('exit', stopRateLimitCleanup);
        process.on('SIGINT', () => {
            stopRateLimitCleanup();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            stopRateLimitCleanup();
            process.exit(0);
        });
    }
}

// FIXED (BUG-004): Stop cleanup interval
export function stopRateLimitCleanup(): void {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
    isCleanupStarted = false;
}

// FIXED (BUG-004): Get cleanup status untuk debugging
export function getRateLimitStatus(): { 
    isRunning: boolean; 
    entriesCount: number;
    intervalId: NodeJS.Timeout | null 
} {
    return {
        isRunning: isCleanupStarted,
        entriesCount: rateLimitMap.size,
        intervalId: cleanupInterval
    };
}

// Auto-start hanya di production untuk menghindari multiple intervals saat HMR
if (typeof global !== 'undefined' && process.env.NODE_ENV === 'production') {
    startRateLimitCleanup();
}
