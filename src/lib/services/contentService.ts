import { db } from '@/lib/firebaseAdmin';
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
    return `firebase:${path}`;
}

/**
 * Get cache stats untuk monitoring (delegates to CacheManager).
 */
export function getCacheStats() {
    return contentCache.getDetailedStats();
}

/**
 * Generic service to handle content storage via Firebase Realtime Database
 * 
 * OPTIMIZATION: Menambahkan memory cache untuk mengurangi bandwidth Firebase.
 * Cache TTL: Default 30 detik, tapi bisa custom (about data pakai 5 detik).
 */
export class ContentService<T> {
    private firebasePath: string;
    private fallbackData: T;
    private cacheTTL: number;

    /**
     * @param filename - Nama file JSON (tanpa .json)
     * @param fallbackData - Data default kalau Firebase kosong/error
     * @param cacheTTL - Cache duration dalam ms (default: 30 detik, about: 5 detik)
     */
    constructor(filename: string, fallbackData: T, cacheTTL?: number) {
        // Use filename without extension as the node in Firebase
        const nodeName = filename.replace('.json', '');
        this.firebasePath = `content/${nodeName}`;
        this.fallbackData = fallbackData;
        // About data pakai TTL lebih pendek karena positions sering berubah
        this.cacheTTL = cacheTTL || (nodeName === 'about' ? ABOUT_CACHE_TTL : 30_000);
    }

    async getData(noCache = false): Promise<T> {
        const cacheKey = getCacheKey(this.firebasePath);

        // Cek memory cache dulu (kecuali noCache=true)
        if (!noCache) {
            const cached = contentCache.get<T>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        try {
            const snapshot = await db.ref(this.firebasePath).once('value');
            const firebaseData = snapshot.val();

            if (!firebaseData) {
                return this.fallbackData;
            }

            // Merge dengan fallback: field baru di fallback yang gak ada di Firebase tetap kebawa
            const mergedData = this.deepMerge(this.fallbackData, firebaseData);
            
            // Simpan ke cache dengan TTL spesifik
            contentCache.set(cacheKey, mergedData, this.cacheTTL);

            return mergedData as T;
        } catch (error) {
            console.error(`[ContentService] Error loading data from ${this.firebasePath}:`, error);
            return this.fallbackData;
        }
    }

    /**
     * Deep merge fallback (base) dengan firebase data (override)
     * Firebase data menang untuk field yang sama, tapi field baru di fallback tetap kebawa
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
            await this.pendingSave;
        }

        this.pendingSave = this._doSave(data, _message);
        const result = await this.pendingSave;
        this.pendingSave = null;
        return result;
    }

    private async _doSave(data: T, _message?: string): Promise<boolean> {
        try {
            // For arrays, we save them directly to avoid converting to object with numeric keys.
            // For objects, we merge with updatedAt.
            const payload = Array.isArray(data)
                ? data
                : { ...(data as Record<string, unknown>), updatedAt: new Date().toISOString() };

            // MEDIUM FIX: Clear cache SEBELUM save untuk mencegah stale data read
            // Jika ada request antara clear dan save, mereka akan fetch dari Firebase (fresh data)
            contentCache.delete(getCacheKey(this.firebasePath));

            await db.ref(this.firebasePath).set(payload);

            // Set cache dengan data baru (optimistic update)
            contentCache.set(getCacheKey(this.firebasePath), data as unknown as object, this.cacheTTL);

            return true;
        } catch (error) {
            console.error(`[ContentService] Error saving data to ${this.firebasePath}:`, error);
            return false;
        }
    }
}
