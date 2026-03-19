/* @ts-nocheck */
/**
 * Real-time Sync Service - Hemat Bandwidth
 * 
 * Strategy: Listen hanya lastUpdated timestamp (1 field kecil),
 * fetch data lengkap hanya kalau timestamp berubah.
 * 
 * Bandwidth usage: ~50 bytes/detik vs ~50KB/detik (full listener)
 * 
 * MEDIUM FIX: Fixed listener leak dan race condition pada rapid mount/unmount
 */

import { useEffect, useRef, useCallback } from 'react';

// Type declarations for Firebase SDK (loaded dynamically in browser)
type FirebaseDatabase = any;
type OnValueFn = any;
type RefFn = any;
type OffFn = any;

let db: FirebaseDatabase | null = null;
let onValueFn: OnValueFn | null = null;
let refFn: RefFn | null = null;
let offFn: OffFn | null = null;

// MEDIUM FIX: Lock untuk mencegah multiple parallel initFirebaseClient calls
let initPromise: Promise<boolean> | null = null;

// Lazy load Firebase client SDK (hanya browser)
async function initFirebaseClient(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (db) return true;
    
    // MEDIUM FIX: Return existing promise jika sedang inisialisasi
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
        try {
            // Cek environment variable tersedia
            const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
            const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
            
            if (!apiKey || !databaseURL) {
                console.warn('[RealtimeSync] Firebase config missing. Real-time sync disabled.');
                return false;
            }
            
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
            
            return true;
        } catch (error) {
            console.error('[RealtimeSync] Failed to init Firebase client:', error);
            return false;
        } finally {
            // Clear lock setelah selesai (success atau error)
            setTimeout(() => { initPromise = null; }, 0);
        }
    })();
    
    return initPromise;
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
 * MEDIUM FIX: Fixed listener leak dan race condition pada rapid mount/unmount
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
    // MEDIUM FIX: Refs untuk reliable cleanup
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const isActiveRef = useRef(true);
    const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTimestampChange = useCallback((snapshot: Snapshot) => {
        const newTimestamp = snapshot.val() as string | null;
        
        if (!newTimestamp) return;
        
        // MEDIUM FIX: Check isActiveRef untuk mencegah update setelah unmount
        if (!isActiveRef.current) return;
        
        // Skip kalau pertama kali load (hanya track perubahan)
        if (!isInitializedRef.current) {
            lastTimestampRef.current = newTimestamp;
            isInitializedRef.current = true;
            return;
        }
        
        // Trigger update hanya kalau timestamp berbeda
        if (newTimestamp !== lastTimestampRef.current) {
            lastTimestampRef.current = newTimestamp;
            onUpdate();
        }
    }, [onUpdate]);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Reset active flag
        isActiveRef.current = true;

        const setupListener = async () => {
            const initialized = await initFirebaseClient();
            
            // MEDIUM FIX: Check isActiveRef setelah async operation
            if (!isActiveRef.current) return;
            
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

            // Simpan unsubscribe function ke ref
            unsubscribeRef.current = () => {
                if (offFn && lastUpdatedRef) {
                    try {
                        offFn(lastUpdatedRef, 'value', handleTimestampChange);
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
            };
        };

        // MEDIUM FIX: Delay setup untuk mencegah rapid mount/unmount issues
        setupTimeoutRef.current = setTimeout(() => {
            if (isActiveRef.current) {
                setupListener();
            }
        }, 100);

        return () => {
            // Mark as inactive immediately
            isActiveRef.current = false;
            
            // Clear setup timeout
            if (setupTimeoutRef.current) {
                clearTimeout(setupTimeoutRef.current);
                setupTimeoutRef.current = null;
            }
            
            // Unsubscribe listener
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
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
