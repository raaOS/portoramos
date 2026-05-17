import { db } from '@/lib/database';
import { CacheManager } from '@/lib/cache/CacheManager';

/**
 * Shared cache instance for content data.
 * 
 * FIXED (BUG-007): Uses CacheManager with max size limit and LRU eviction
 * to prevent unbounded memory growth.
 */
const contentCache = new CacheManager({
    defaultTTL: 30_000,  // 30 detik
    maxSize: 50,
    label: 'ContentService',
});

const ABOUT_CACHE_TTL = 5000; // 5 detik (positions berubah sering)

function getCacheKey(path: string): string {
    return `d1:${path}`;
}

/**
 * Get cache stats untuk monitoring (delegates to CacheManager).
 */
export function getCacheStats() {
    return contentCache.getDetailedStats();
}

/**
 * Generic service to handle content storage via Cloudflare D1.
 * Cache TTL: Default 30 detik, tapi bisa custom (about data pakai 5 detik).
 */
export class ContentService<T> {
    private dataPath: string;
    private fallbackData: T;
    private cacheTTL: number;
    private skipFallbackMerge: boolean;

    /**
     * @param filename - Nama file JSON (tanpa .json)
     * @param fallbackData - Data default kalau remote data kosong/error
     * @param cacheTTL - Cache duration dalam ms (default: 30 detik, about: 5 detik)
     * @param skipFallbackMerge - Jika true, remote data jadi source of truth (tidak merge dengan fallback).
     *   Ini mencegah field yang dihapus admin muncul lagi dari fallback JSON.
     */
    constructor(filename: string, fallbackData: T, cacheTTL?: number, skipFallbackMerge = false) {
        const nodeName = filename.replace('.json', '');
        this.dataPath = `content/${nodeName}`;
        this.fallbackData = fallbackData;
        // About data pakai TTL lebih pendek karena positions sering berubah
        this.cacheTTL = cacheTTL || (nodeName === 'about' ? ABOUT_CACHE_TTL : 30_000);
        this.skipFallbackMerge = skipFallbackMerge;
    }

    async getData(noCache = false): Promise<T> {
        const cacheKey = getCacheKey(this.dataPath);

        // Cek memory cache dulu (kecuali noCache=true)
        if (!noCache) {
            const cached = contentCache.get<T>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const timeout = new Promise<null>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Data backend timeout')), 5000);
        });

        try {
            const snapshot = await Promise.race([
                db.ref(this.dataPath).once('value'),
                timeout
            ]) as { val: () => unknown };

            const remoteData = snapshot?.val?.() ?? snapshot?.val;

            if (!remoteData) {
                return this.fallbackData;
            }

            // Merge dengan fallback (kecuali skipFallbackMerge=true).
            // skipFallbackMerge penting untuk domain di mana admin delete
            // field harus benar-benar hilang, bukan restored dari fallback.
            const finalData = this.skipFallbackMerge
                ? (remoteData as T)
                : (this.deepMerge(this.fallbackData, remoteData) as T);

            // Simpan ke cache dengan TTL spesifik
            contentCache.set(cacheKey, finalData, this.cacheTTL);

            return finalData;
        } catch (error) {
            console.error(`[ContentService] Error loading data from ${this.dataPath}:`, error);
            return this.fallbackData;
        } finally {
            // MEMORY-LEAK FIX: clear timer regardless of outcome
            if (timeoutId) clearTimeout(timeoutId);
        }
    }

    /**
     * Deep merge fallback (base) dengan remote data (override).
     */
    private deepMerge(base: unknown, override: unknown): unknown {
        if (override === null || override === undefined) {
            return base;
        }
        if (base === null || base === undefined) {
            return override;
        }
        
        // Jika array, pakai override
        if (Array.isArray(override)) {
            return override;
        }
        
        // Jika primitive, pakai override
        if (typeof override !== 'object' || typeof base !== 'object') {
            return override;
        }
        
        // Merge objects
        const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
        
        for (const key of Object.keys(override as Record<string, unknown>)) {
            const baseVal = (base as Record<string, unknown>)[key];
            const overrideVal = (override as Record<string, unknown>)[key];
            
            result[key] = this.deepMerge(baseVal, overrideVal);
        }
        
        return result;
    }

    // Track ongoing saves untuk mencegah race condition
    private pendingSave: Promise<boolean> | null = null;

    async saveData(data: T, _message?: string): Promise<boolean> {
        // MEDIUM FIX: Queue multiple saves to prevent race condition
        if (this.pendingSave) {
            try {
                await this.pendingSave;
            } catch (err) {
                console.warn('[ContentService] Previous save failed, proceeding with new save', err);
            }
        }

        this.pendingSave = this._doSave(data, _message);
        try {
            const result = await this.pendingSave;
            return result;
        } finally {
            this.pendingSave = null;
        }
    }

    private async _doSave(data: T, _message?: string): Promise<boolean> {
        try {
            // For arrays, we save them directly to avoid converting to object with numeric keys.
            // For objects, we merge with updatedAt.
            const payload = Array.isArray(data)
                ? data
                : { ...(data as Record<string, unknown>), updatedAt: new Date().toISOString() };

            // MEDIUM FIX: Clear cache SEBELUM save untuk mencegah stale data read
            contentCache.delete(getCacheKey(this.dataPath));

            await db.ref(this.dataPath).set(payload);

            // CRITICAL FIX: Cache `payload` (dengan updatedAt), bukan raw `data`.
            // Kalau cache tanpa updatedAt, next-read dalam TTL return data stale,
            // dan komparasi lastUpdated di client jadi broken.
            contentCache.set(getCacheKey(this.dataPath), payload as unknown as object, this.cacheTTL);

            return true;
        } catch (error) {
            console.error(`[ContentService] Error saving data to ${this.dataPath}:`, error);
            return false;
        }
    }
}

