import { checkDataRateLimit } from '@/lib/dataRateLimit';

const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_BLOCK = 5 * 60 * 1000;

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
}

export async function checkRateLimit(chatId: string): Promise<RateLimitResult> {
    const safeChatId = String(chatId).replace(/[.#$/[\]]/g, '_');

    const result = await checkDataRateLimit(
        `telegram_${safeChatId}`,
        RATE_LIMIT_MAX,
        RATE_LIMIT_WINDOW,
        RATE_LIMIT_BLOCK
    );

    return {
        allowed: result.allowed,
        remaining: result.allowed ? RATE_LIMIT_MAX - 1 : 0,
    };
}
