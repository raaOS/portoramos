import { db } from '@/lib/firebaseAdmin';

/**
 * Simple in-memory cache untuk menghindari redundant fetch.
 * Default cache di-reset setiap 30 detik.
 * 
 * FIXED (BUG-007): Menambahkan max size limit dan LRU eviction policy
 * untuk mencegah unbounded memory growth.
 * 
 * NOTE: About data menggunakan TTL lebih pendek (5 detik) karena
 * positions sering berubah oleh admin.
 */

interface CacheEntry {
    data: unknown;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
}

const memoryCache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL = 30000; // 30 detik
const ABOUT_CACHE_TTL = 5000;    // 5 detik (positions berubah sering)

// FIXED (BUG-007): Cache size limits
const MAX_CACHE_SIZE = 50; // Maximum number of entries

function getCacheKey(path: string): string {
    return `firebase:${path}`;
}

function evictLRU(): void {
    if (memoryCache.size === 0) return;
    
    // Find least recently used entry
    let lruKey: string | null = null;
    let lruTime = Infinity;
    
    for (const [key, entry] of memoryCache.entries()) {
        if (entry.lastAccessed < lruTime) {
            lruTime = entry.lastAccessed;
            lruKey = key;
        }
    }
    
    if (lruKey) {
        console.log(`[ContentService] LRU evicting key: ${lruKey}`);
        memoryCache.delete(lruKey);
    }
}

function getFromCache<T>(key: string): T | null {
    const cached = memoryCache.get(key);
    if (!cached) return null;
    
    // Gunakan TTL spesifik per entry
    if (Date.now() - cached.timestamp > cached.ttl) {
        memoryCache.delete(key);
        return null;
    }
    
    // FIXED (BUG-007): Update access metadata untuk LRU
    cached.accessCount++;
    cached.lastAccessed = Date.now();
    
    return cached.data as T;
}

function setCache(key: string, data: unknown, ttl = DEFAULT_CACHE_TTL): void {
    // FIXED (BUG-007): Evict oldest entries jika cache penuh
    if (memoryCache.size >= MAX_CACHE_SIZE) {
        evictLRU();
    }
    
    const now = Date.now();
    memoryCache.set(key, { 
        data, 
        timestamp: now, 
        ttl,
        accessCount: 1,
        lastAccessed: now
    });
}

function clearCache(key: string): void {
    memoryCache.delete(key);
}

// FIXED (BUG-007): Get cache stats untuk monitoring
export function getCacheStats(): {
    size: number;
    maxSize: number;
    entries: Array<{ key: string; accessCount: number; age: number }>;
} {
    const now = Date.now();
    const entries = Array.from(memoryCache.entries()).map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        age: now - entry.timestamp
    }));
    
    return {
        size: memoryCache.size,
        maxSize: MAX_CACHE_SIZE,
        entries
    };
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
        this.cacheTTL = cacheTTL || (nodeName === 'about' ? ABOUT_CACHE_TTL : DEFAULT_CACHE_TTL);
    }

    async getData(noCache = false): Promise<T> {
        const cacheKey = getCacheKey(this.firebasePath);

        // Cek memory cache dulu (kecuali noCache=true)
        if (!noCache) {
            const cached = getFromCache<T>(cacheKey);
            if (cached) {
                console.log(`[ContentService] Cache hit for ${this.firebasePath} (TTL: ${this.cacheTTL}ms)`);
                return cached;
            }
        }

        try {
            const snapshot = await db.ref(this.firebasePath).once('value');
            const firebaseData = snapshot.val();

            if (!firebaseData) {
                console.log(`[ContentService] No data at ${this.firebasePath}, using fallback.`);
                return this.fallbackData;
            }

            // Merge dengan fallback: field baru di fallback yang gak ada di Firebase tetap kebawa
            const mergedData = this.deepMerge(this.fallbackData, firebaseData);
            
            // Simpan ke cache dengan TTL spesifik
            setCache(cacheKey, mergedData, this.cacheTTL);

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

    async saveData(data: T, _message?: string): Promise<boolean> {
        try {
            // For arrays, we save them directly to avoid converting to object with numeric keys.
            // For objects, we merge with updatedAt.
            const payload = Array.isArray(data)
                ? data
                : { ...(data as Record<string, unknown>), updatedAt: new Date().toISOString() };

            await db.ref(this.firebasePath).set(payload);

            // Clear cache setelah save agar next fetch dapat data terbaru
            clearCache(getCacheKey(this.firebasePath));

            console.log(`[ContentService] Successfully saved data to ${this.firebasePath}`);
            return true;
        } catch (error) {
            console.error(`[ContentService] Error saving data to ${this.firebasePath}:`, error);
            return false;
        }
    }
}
