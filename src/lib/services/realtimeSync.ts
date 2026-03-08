/**
 * Real-time Sync Service - Hemat Bandwidth
 * 
 * Strategy: Listen hanya lastUpdated timestamp (1 field kecil),
 * fetch data lengkap hanya kalau timestamp berubah.
 * 
 * Bandwidth usage: ~50 bytes/detik vs ~50KB/detik (full listener)
 */

import { useEffect, useRef, useCallback } from 'react';

// FIXED (BUG-011): Proper typing untuk Firebase Database functions
type FirebaseDatabase = import('firebase/database').Database;
type OnValueFn = typeof import('firebase/database').onValue;
type RefFn = typeof import('firebase/database').ref;
type OffFn = typeof import('firebase/database').off;

let db: FirebaseDatabase | null = null;
let onValueFn: OnValueFn | null = null;
let refFn: RefFn | null = null;
let offFn: OffFn | null = null;

// Lazy load Firebase client SDK (hanya browser)
async function initFirebaseClient() {
    if (typeof window === 'undefined') return false;
    if (db) return true;
    
    // Cek environment variable tersedia
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
    
    if (!apiKey || !databaseURL) {
        console.warn('[RealtimeSync] Firebase config missing. Real-time sync disabled.');
        console.warn('[RealtimeSync] Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_DATABASE_URL to .env.local');
        return false;
    }
    
    try {
        const firebaseDatabase = await import('firebase/database');
        const firebaseApp = await import('firebase/app');
        
        // Cek kalau sudah diinisialisasi
        let app;
        try {
            app = firebaseApp.getApp();
        } catch {
            // Firebase belum init, init dengan config dari env
            const firebaseConfig = {
                apiKey,
                databaseURL,
            };
            app = firebaseApp.initializeApp(firebaseConfig);
        }
        
        db = firebaseDatabase.getDatabase(app);
        onValueFn = firebaseDatabase.onValue;
        refFn = firebaseDatabase.ref;
        offFn = firebaseDatabase.off;
        
        console.log('[RealtimeSync] Firebase client initialized successfully');
        return true;
    } catch (error) {
        console.error('[RealtimeSync] Failed to init Firebase client:', error);
        return false;
    }
}

interface UseRealtimeSyncOptions {
    onUpdate: () => void;
    onUnavailable?: () => void;
    enabled?: boolean;
}

type Snapshot = { val: () => unknown };

/**
 * Hook untuk listen lastUpdated timestamp dari Firebase.
 * Trigger onUpdate hanya kalau timestamp berubah (ada CRUD).
 * 
 * @example
 * useRealtimeSync({
 *   onUpdate: () => refreshProjects(),
 *   enabled: isAdmin // Hanya aktif di admin
 * });
 */
export function useRealtimeSync({ onUpdate, onUnavailable, enabled = true }: UseRealtimeSyncOptions) {
    const lastTimestampRef = useRef<string | null>(null);
    const isInitializedRef = useRef(false);

    const handleTimestampChange = useCallback((snapshot: Snapshot) => {
        const newTimestamp = snapshot.val() as string | null;
        
        if (!newTimestamp) return;
        
        // Skip kalau pertama kali load (hanya track perubahan)
        if (!isInitializedRef.current) {
            lastTimestampRef.current = newTimestamp;
            isInitializedRef.current = true;
            console.log('[RealtimeSync] Initial timestamp:', newTimestamp);
            return;
        }
        
        // Trigger update hanya kalau timestamp berbeda
        if (newTimestamp !== lastTimestampRef.current) {
            console.log('[RealtimeSync] Data changed! Old:', lastTimestampRef.current, 'New:', newTimestamp);
            lastTimestampRef.current = newTimestamp;
            onUpdate();
        }
    }, [onUpdate]);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        let unsubscribe: (() => void) | null = null;
        let isActive = true;

        const setupListener = async () => {
            const initialized = await initFirebaseClient();
            if (!isActive) return;
            
            // Kalau Firebase tidak tersedia, panggil callback
            if (!initialized) {
                console.warn('[RealtimeSync] Firebase not available, realtime sync disabled');
                onUnavailable?.();
                return;
            }

            if (!db || !onValueFn || !refFn || !offFn) {
                console.warn('[RealtimeSync] Firebase not available');
                onUnavailable?.();
                return;
            }

            // Listen hanya lastUpdated (1 field kecil!)
            const lastUpdatedRef = refFn(db, 'lastUpdated');
            
            onValueFn(lastUpdatedRef, handleTimestampChange);
            
            console.log('[RealtimeSync] Listening to lastUpdated...');

            unsubscribe = () => {
                if (offFn && lastUpdatedRef) {
                    offFn(lastUpdatedRef, 'value', handleTimestampChange);
                }
            };
        };

        setupListener();

        return () => {
            isActive = false;
            if (unsubscribe) {
                unsubscribe();
                console.log('[RealtimeSync] Unsubscribed');
            }
        };
    }, [enabled, handleTimestampChange, onUnavailable]);
}

/**
 * Manual check untuk compare timestamp.
 * Bisa dipakai untuk polling fallback.
 */
export async function checkForUpdates(lastKnownTimestamp: string | null): Promise<{
    hasUpdate: boolean;
    newTimestamp: string | null;
}> {
    try {
        const response = await fetch('/api/projects?status=published', {
            cache: 'no-store'
        });
        
        if (!response.ok) {
            return { hasUpdate: false, newTimestamp: lastKnownTimestamp };
        }
        
        const data = await response.json();
        const newTimestamp = data.data?.lastUpdated || null;
        
        return {
            hasUpdate: newTimestamp !== lastKnownTimestamp,
            newTimestamp
        };
    } catch (error) {
        console.error('[RealtimeSync] Check for updates failed:', error);
        return { hasUpdate: false, newTimestamp: lastKnownTimestamp };
    }
}
