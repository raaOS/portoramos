/**
 * Rate Limiting — Firebase-backed (Serverless Safe)
 * 
 * Replaces the old in-memory Map-based rate limiter that was unreliable
 * on serverless platforms (Vercel) due to cold starts and multiple instances.
 * 
 * Falls back to in-memory for development/testing when Firebase is unavailable.
 */
import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';

const MAX_ATTEMPTS = 100
const LOCKOUT_MS = 15 * 60 * 1000       // 15 minutes
const WINDOW_MS = 15 * 60 * 1000        // 15 minutes

// In-memory fallback for development/testing
const localLimits = new Map<string, {
    count: number;
    lastAttempt: number;
    lockedUntil?: number;
}>()

/**
 * Checks if the given IP address has exceeded the rate limit.
 * Uses Firebase in production for persistence across cold starts.
 * Falls back to in-memory for development/testing.
 * 
 * @param ip - The IP address to check.
 * @returns true if the request is allowed, false if rate-limited or locked out.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
    if (!ip) return false

    // Use Firebase-backed rate limiter for persistence across serverless instances
    try {
        const result = await checkFirebaseRateLimit(ip, MAX_ATTEMPTS, WINDOW_MS, LOCKOUT_MS);
        return result.allowed;
    } catch {
        // Fallback to in-memory if Firebase unavailable (e.g., in development)
        return checkRateLimitLocal(ip);
    }
}

/**
 * In-memory fallback rate limiter (for development/testing only).
 */
function checkRateLimitLocal(ip: string): boolean {
    const now = Date.now()
    const attempt = localLimits.get(ip) || { count: 0, lastAttempt: 0 }

    if (attempt.lockedUntil && now > attempt.lockedUntil) {
        attempt.count = 0
        attempt.lockedUntil = undefined
    }

    if (attempt.lockedUntil && now <= attempt.lockedUntil) {
        return false
    }

    if (now - attempt.lastAttempt > WINDOW_MS) {
        attempt.count = 0
    }

    if (attempt.count >= MAX_ATTEMPTS) {
        attempt.lockedUntil = now + LOCKOUT_MS
        localLimits.set(ip, attempt)
        return false
    }

    attempt.count++
    attempt.lastAttempt = now
    localLimits.set(ip, attempt)
    return true
}

/**
 * Resets the rate limiting record for a specific IP address.
 * 
 * @param ip - The IP address to reset.
 */
export function resetRateLimit(ip: string): void {
    if (!ip) return
    localLimits.delete(ip)
    // Note: Firebase records are not cleaned here to save API calls.
    // They expire naturally via the window/block duration.
}

/**
 * Cleanup old rate limit entries (in-memory fallback only).
 */
export function cleanupRateLimits(): void {
    const now = Date.now()
    const cutoff = now - (24 * 60 * 60 * 1000) // 24 hours

    for (const [ip, data] of localLimits.entries()) {
        if (data.lastAttempt < cutoff) {
            localLimits.delete(ip)
        }
    }
}
