import { checkDataRateLimit } from '@/lib/dataRateLimit';

const MAX_ATTEMPTS = 100;
const LOCKOUT_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;

const localLimits = new Map<string, {
    count: number;
    lastAttempt: number;
    lockedUntil?: number;
}>();

export async function checkRateLimit(ip: string): Promise<boolean> {
    if (!ip) return false;

    try {
        const result = await checkDataRateLimit(ip, MAX_ATTEMPTS, WINDOW_MS, LOCKOUT_MS);
        return result.allowed;
    } catch {
        return checkRateLimitLocal(ip);
    }
}

function checkRateLimitLocal(ip: string): boolean {
    const now = Date.now();
    const attempt = localLimits.get(ip) || { count: 0, lastAttempt: 0 };

    if (attempt.lockedUntil && now > attempt.lockedUntil) {
        attempt.count = 0;
        attempt.lockedUntil = undefined;
    }

    if (attempt.lockedUntil && now <= attempt.lockedUntil) {
        return false;
    }

    if (now - attempt.lastAttempt > WINDOW_MS) {
        attempt.count = 0;
    }

    if (attempt.count >= MAX_ATTEMPTS) {
        attempt.lockedUntil = now + LOCKOUT_MS;
        localLimits.set(ip, attempt);
        return false;
    }

    attempt.count++;
    attempt.lastAttempt = now;
    localLimits.set(ip, attempt);
    return true;
}

export function resetRateLimit(ip: string): void {
    if (!ip) return;
    localLimits.delete(ip);
}

export function cleanupRateLimits(): void {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000);

    for (const [ip, data] of localLimits.entries()) {
        if (data.lastAttempt < cutoff) {
            localLimits.delete(ip);
        }
    }
}
