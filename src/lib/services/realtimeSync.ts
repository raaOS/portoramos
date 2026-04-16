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
import type { DataSnapshot, Database, DatabaseReference } from 'firebase/database';

type FirebaseDatabaseModule = typeof import('firebase/database');

let db: Database | null = null;
let onValueFn: FirebaseDatabaseModule['onValue'] | null = null;
let refFn: FirebaseDatabaseModule['ref'] | null = null;
let offFn: FirebaseDatabaseModule['off'] | null = null;

// Lock untuk mencegah multiple parallel initFirebaseClient calls
let initPromise: Promise<boolean> | null = null;

// AbortController untuk cancel ongoing initialization
let initAbortController: AbortController | null = null;

// Track if we've already warned about missing config to avoid console spam
let hasWarnedMissingConfig = false;

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
            
            if (!apiKey || !databaseURL || apiKey === 'YOUR_FIREBASE_WEB_API_KEY_HERE') {
                if (!hasWarnedMissingConfig) {
                    const msg = '[RealtimeSync] Firebase config missing or using placeholder. Real-time sync disabled.';
                    if (process.env.NODE_ENV === 'development') {
                        console.info(msg);
                        console.info('Tip: Add NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_DATABASE_URL to .env.local to enable real-time sync.');
                    } else {
                        console.warn(msg);
                    }
                    hasWarnedMissingConfig = true;
                }
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

/**
 * Hook untuk listen lastUpdated timestamp dari Firebase.
 * Trigger onUpdate hanya kalau timestamp berubah (ada CRUD).
 */
export function useRealtimeSync({ onUpdate, onUnavailable, enabled = true }: UseRealtimeSyncOptions) {
    const lastTimestampRef = useRef<string | null>(null);
    const isInitializedRef = useRef(false);
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const isActiveRef = useRef(true);
    const mountedRef = useRef(true);
    const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const listenerRef = useRef<((snapshot: DataSnapshot) => void) | null>(null);
    const lastUpdatedRefPath = useRef<DatabaseReference | null>(null);

    const handleTimestampChange = useCallback((snapshot: DataSnapshot) => {
        if (!mountedRef.current || !isActiveRef.current) return;
        
        const newTimestamp = snapshot.val() as string | null;
        if (!newTimestamp) return;
        
        if (!isInitializedRef.current) {
            lastTimestampRef.current = newTimestamp;
            isInitializedRef.current = true;
            return;
        }
        
        if (newTimestamp !== lastTimestampRef.current) {
            lastTimestampRef.current = newTimestamp;
            if (mountedRef.current && isActiveRef.current) {
                onUpdate();
            }
        }
    }, [onUpdate]);

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        isActiveRef.current = true;
        mountedRef.current = true;
        abortControllerRef.current = new AbortController();

        const cleanupListener = () => {
            if (offFn && lastUpdatedRefPath.current && listenerRef.current) {
                try {
                    offFn(lastUpdatedRefPath.current, 'value', listenerRef.current);
                } catch (e) { /* ignore */ }
            }
            
            if (unsubscribeRef.current) {
                try {
                    unsubscribeRef.current();
                } catch (e) { /* ignore */ }
                unsubscribeRef.current = null;
            }
            
            listenerRef.current = null;
            lastUpdatedRefPath.current = null;
        };

        const setupListener = async () => {
            if (!mountedRef.current || !isActiveRef.current) return;
            
            const initialized = await initFirebaseClient(abortControllerRef.current?.signal);
            
            if (!mountedRef.current || !isActiveRef.current || abortControllerRef.current?.signal.aborted) {
                cleanupListener();
                return;
            }
            
            if (!initialized) {
                if (mountedRef.current && isActiveRef.current) {
                    onUnavailable?.();
                }
                return;
            }

            if (!db || !onValueFn || !refFn || !offFn) {
                if (mountedRef.current && isActiveRef.current) {
                    onUnavailable?.();
                }
                return;
            }

            try {
                lastUpdatedRefPath.current = refFn(db, 'lastUpdated');
                listenerRef.current = handleTimestampChange;
                onValueFn(lastUpdatedRefPath.current, handleTimestampChange);
                
                unsubscribeRef.current = () => cleanupListener();
            } catch (error) {
                if (mountedRef.current && isActiveRef.current) {
                    console.error('[RealtimeSync] Error setting up listener:', error);
                }
            }
        };

        setupTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && isActiveRef.current) {
                setupListener();
            }
        }, 100);

        return () => {
            isActiveRef.current = false;
            mountedRef.current = false;
            
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            
            if (setupTimeoutRef.current) {
                clearTimeout(setupTimeoutRef.current);
                setupTimeoutRef.current = null;
            }
            
            cleanupListener();
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
