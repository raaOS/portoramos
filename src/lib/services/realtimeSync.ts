/* @ts-nocheck */
/**
 * Real-time Sync Service - Hemat Bandwidth
 * 
 * Strategy: Listen hanya lastUpdated timestamp (1 field kecil),
 * fetch data lengkap hanya kalau timestamp berubah.
 * 
 * Bandwidth usage: ~50 bytes/detik vs ~50KB/detik (full listener)
 * 
 * RACE CONDITION FIX: Strengthened cleanup logic, AbortController pattern,
 * mounted ref checks before all state updates, and proper timeout clearing
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

// Lock untuk mencegah multiple parallel initFirebaseClient calls
let initPromise: Promise<boolean> | null = null;

// AbortController untuk cancel ongoing initialization
let initAbortController: AbortController | null = null;

// Lazy load Firebase client SDK (hanya browser)
async function initFirebaseClient(signal?: AbortSignal): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (db) return true;
    
    // Return existing promise jika sedang inisialisasi dan tidak di-cancel
    if (initPromise && !initAbortController?.signal.aborted) {
        return initPromise;
    }
    
    // Create new AbortController untuk init ini
    initAbortController = new AbortController();
    
    initPromise = (async () => {
        try {
            // Check abort sebelum mulai
            if (signal?.aborted || initAbortController?.signal.aborted) {
                return false;
            }
            
            // Cek environment variable tersedia
            const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
            const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
            
            if (!apiKey || !databaseURL) {
                console.warn('[RealtimeSync] Firebase config missing. Real-time sync disabled.');
                return false;
            }
            
            // Check abort sebelum dynamic import
            if (signal?.aborted || initAbortController?.signal.aborted) {
                return false;
            }
            
            const firebaseDatabase = await import('firebase/database');
            
            // Check abort setelah import
            if (signal?.aborted || initAbortController?.signal.aborted) {
                return false;
            }
            
            const firebaseApp = await import('firebase/app');
            
            // Check abort setelah import
            if (signal?.aborted || initAbortController?.signal.aborted) {
                return false;
            }
            
            // Cek kalau sudah diinisialisasi
            let app;
            try {
                app = firebaseApp.getApp();
            } catch {
                // Check abort sebelum initialize
                if (signal?.aborted || initAbortController?.signal.aborted) {
                    return false;
                }
                // Firebase belum init, init dengan config dari env
                const firebaseConfig = {
                    apiKey,
                    databaseURL,
                };
                app = firebaseApp.initializeApp(firebaseConfig);
            }
            
            // Check abort sebelum getDatabase
            if (signal?.aborted || initAbortController?.signal.aborted) {
                return false;
            }
            
            db = firebaseDatabase.getDatabase(app);
            onValueFn = firebaseDatabase.onValue;
            refFn = firebaseDatabase.ref;
            offFn = firebaseDatabase.off;
            
            return true;
        } catch (error) {
            // Jangan log error jika aborted
            if (signal?.aborted || initAbortController?.signal.aborted) {
                return false;
            }
            console.error('[RealtimeSync] Failed to init Firebase client:', error);
            return false;
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
 * RACE CONDITION FIX: 
 * - Strengthened cleanup dengan mountedRef check
 * - AbortController untuk cancel async operations
 * - setupTimeoutRef selalu di-clear
 * - isActiveRef check setelah EVERY await
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
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const isActiveRef = useRef(true);
    const mountedRef = useRef(true);
    const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const listenerRef = useRef<any>(null);
    const lastUpdatedRefPath = useRef<any>(null);

    const handleTimestampChange = useCallback((snapshot: Snapshot) => {
        // GUARD: Check mounted dan active
        if (!mountedRef.current || !isActiveRef.current) return;
        
        const newTimestamp = snapshot.val() as string | null;
        
        if (!newTimestamp) return;
        
        // GUARD: Check lagi setelah async operation (val() bisa jadi async di beberapa case)
        if (!mountedRef.current || !isActiveRef.current) return;
        
        // Skip kalau pertama kali load (hanya track perubahan)
        if (!isInitializedRef.current) {
            lastTimestampRef.current = newTimestamp;
            isInitializedRef.current = true;
            return;
        }
        
        // Trigger update hanya kalau timestamp berbeda
        if (newTimestamp !== lastTimestampRef.current) {
            lastTimestampRef.current = newTimestamp;
            // GUARD: Final check sebelum callback
            if (mountedRef.current && isActiveRef.current) {
                onUpdate();
            }
        }
    }, [onUpdate]);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Reset flags
        isActiveRef.current = true;
        mountedRef.current = true;
        
        // Create AbortController untuk operation ini
        abortControllerRef.current = new AbortController();

        const cleanupListener = () => {
            // Unsubscribe listener dengan Firebase off()
            if (offFn && lastUpdatedRefPath.current && listenerRef.current) {
                try {
                    offFn(lastUpdatedRefPath.current, 'value', listenerRef.current);
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
            
            // Fallback: gunakan unsubscribeRef jika tersedia
            if (unsubscribeRef.current) {
                try {
                    unsubscribeRef.current();
                } catch (e) {
                    // Ignore cleanup errors
                }
                unsubscribeRef.current = null;
            }
            
            // Clear refs
            listenerRef.current = null;
            lastUpdatedRefPath.current = null;
        };

        const setupListener = async () => {
            // GUARD: Check mounted dan active sebelum init
            if (!mountedRef.current || !isActiveRef.current) return;
            
            const initialized = await initFirebaseClient(abortControllerRef.current?.signal);
            
            // GUARD: Check isActiveRef dan mountedRef setelah async operation
            if (!mountedRef.current || !isActiveRef.current) {
                cleanupListener();
                return;
            }
            
            // GUARD: Check abort
            if (abortControllerRef.current?.signal.aborted) {
                cleanupListener();
                return;
            }
            
            // Kalau Firebase tidak tersedia, panggil callback
            if (!initialized) {
                console.warn('[RealtimeSync] Firebase not available, realtime sync disabled');
                if (mountedRef.current && isActiveRef.current) {
                    onUnavailable?.();
                }
                return;
            }

            // GUARD: Check lagi sebelum access Firebase objects
            if (!mountedRef.current || !isActiveRef.current) {
                cleanupListener();
                return;
            }

            if (!db || !onValueFn || !refFn || !offFn) {
                console.warn('[RealtimeSync] Firebase not available');
                if (mountedRef.current && isActiveRef.current) {
                    onUnavailable?.();
                }
                return;
            }

            // GUARD: Final check sebelum setup listener
            if (!mountedRef.current || !isActiveRef.current) {
                cleanupListener();
                return;
            }

            try {
                // Listen hanya lastUpdated (1 field kecil!)
                lastUpdatedRefPath.current = refFn(db, 'lastUpdated');
                
                // Simpan reference ke listener untuk cleanup
                listenerRef.current = handleTimestampChange;
                
                onValueFn(lastUpdatedRefPath.current, handleTimestampChange);

                // Simpan unsubscribe function ke ref (fallback)
                unsubscribeRef.current = () => {
                    cleanupListener();
                };
            } catch (error) {
                // Ignore errors jika unmounted
                if (!mountedRef.current || !isActiveRef.current) return;
                console.error('[RealtimeSync] Error setting up listener:', error);
            }
        };

        // Delay setup untuk mencegah rapid mount/unmount issues
        setupTimeoutRef.current = setTimeout(() => {
            // GUARD: Check sebelum setup
            if (mountedRef.current && isActiveRef.current) {
                setupListener();
            }
        }, 100);

        return () => {
            // Mark as inactive and unmounted immediately
            isActiveRef.current = false;
            mountedRef.current = false;
            
            // Abort ongoing operations
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            
            // ALWAYS clear setup timeout - GUARANTEED
            if (setupTimeoutRef.current) {
                clearTimeout(setupTimeoutRef.current);
                setupTimeoutRef.current = null;
            }
            
            // Cleanup listener
            cleanupListener();
            
            // Reset init refs
            isInitializedRef.current = false;
            lastTimestampRef.current = null;
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
