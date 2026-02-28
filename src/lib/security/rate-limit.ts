// Rate limiting storage
const rateLimits = new Map<string, {
    count: number;
    lastAttempt: number;
    lockedUntil?: number;
}>()

const MAX_ATTEMPTS = 100
const LOCKOUT_MINUTES = 15

/**
 * Checks if the given IP address has exceeded the rate limit.
 * Implements a lockout period if the maximum number of attempts is reached.
 * 
 * @param ip - The IP address to check.
 * @returns true if the request is allowed, false if rate-limited or locked out.
 */
export function checkRateLimit(ip: string): boolean {
    if (!ip) return false

    const now = Date.now()
    const attempt = rateLimits.get(ip) || { count: 0, lastAttempt: 0 }

    // Reset if lockout period has passed
    if (attempt.lockedUntil && now > attempt.lockedUntil) {
        attempt.count = 0
        attempt.lockedUntil = undefined
    }

    // Check if currently locked out
    if (attempt.lockedUntil && now <= attempt.lockedUntil) {
        return false
    }

    // Reset count if enough time has passed
    if (now - attempt.lastAttempt > LOCKOUT_MINUTES * 60 * 1000) {
        attempt.count = 0
    }

    // Check if max attempts reached
    if (attempt.count >= MAX_ATTEMPTS) {
        attempt.lockedUntil = now + (LOCKOUT_MINUTES * 60 * 1000)
        rateLimits.set(ip, attempt)
        return false
    }

    attempt.count++
    attempt.lastAttempt = now
    rateLimits.set(ip, attempt)

    return true
}

/**
 * Resets the rate limiting record for a specific IP address.
 * 
 * @param ip - The IP address to reset.
 */
export function resetRateLimit(ip: string): void {
    if (!ip) return
    rateLimits.delete(ip)
}

/**
 * Cleanup old rate limit entries.
 */
export function cleanupRateLimits(): void {
    const now = Date.now()
    const cutoff = now - (24 * 60 * 60 * 1000) // 24 hours

    for (const [ip, data] of rateLimits.entries()) {
        if (data.lastAttempt < cutoff) {
            rateLimits.delete(ip)
        }
    }
}
