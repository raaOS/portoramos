'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// MEDIUM FIX: BroadcastChannel untuk sinkronisasi CSRF token antar tab
const CHANNEL_NAME = 'admin-auth-sync';

/**
 * Hook to check if current user is authenticated as admin
 * Uses API call since admin_token cookie is HttpOnly and cannot be read by JS
 * 
 * MEDIUM FIX: Added cross-tab synchronization and request deduplication
 */
export function useAdminAuth() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // Refs untuk tracking
    const abortControllerRef = useRef<AbortController | null>(null);
    const isFetchingRef = useRef(false);
    const channelRef = useRef<BroadcastChannel | null>(null);
    const csrfTokenRef = useRef(csrfToken);

    const logout = async () => {
        try {
            // Primary logout attempt
            await fetch('/api/admin/logout', {
                method: 'POST',
                headers: {
                    'x-csrf-token': csrfToken
                },
                credentials: 'include'
            });

            // Optimistic clear
            setIsAdmin(false);
            setCsrfToken('');

            // Broadcast logout ke tab lain
            if (channelRef.current) {
                channelRef.current.postMessage({ type: 'logout' });
            }

            // Give the browser a moment to process cookie deletions
            await new Promise(resolve => setTimeout(resolve, 800));

            // Hard redirect to clear all contexts and re-render everything as visitor
            window.location.href = '/?logged_out=true';
        } catch (e) {
            console.error('Logout failed, forcing redirect:', e);
            window.location.href = '/?logged_out=error';
        }
    };

    // MEDIUM FIX: Deduplicate concurrent auth checks
    const checkAuth = useCallback(async (force = false) => {
        // Skip if already fetching (unless forced)
        if (isFetchingRef.current && !force) return;
        
        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        
        isFetchingRef.current = true;

        try {
            const res = await fetch(`/api/admin/check-auth?t=${Date.now()}`, {
                credentials: 'include',
                signal: abortControllerRef.current.signal
            });
            
            if (res.status === 0) return; // Aborted
            
            const data = await res.json();
            const authed = data.authenticated === true;
            
            setIsAdmin(authed);
            if (data.csrfToken) {
                setCsrfToken(data.csrfToken);
                csrfTokenRef.current = data.csrfToken;
                // Broadcast token ke tab lain jika berubah
                if (channelRef.current && data.csrfToken !== csrfTokenRef.current) {
                    channelRef.current.postMessage({ 
                        type: 'token-update', 
                        token: data.csrfToken,
                        isAdmin: authed 
                    });
                }
            } else if (!authed) {
                setCsrfToken('');
                csrfTokenRef.current = '';
            }

            // Normal completion
            isFetchingRef.current = false;
            setIsLoading(false);
        } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') {
                // Jika digugurkan (komponen unmount/remount), reset isFetching tapi JANGAN ubah state loading/admin
                isFetchingRef.current = false;
                return;
            }
            console.error('Failed to check admin auth:', e);
            setIsAdmin(false);
            
            // Error completion
            isFetchingRef.current = false;
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Handle explicit logout param in URL
        if (typeof window !== 'undefined' && window.location.search.includes('logged_out=true')) {
            setTimeout(() => {
                setIsAdmin(false);
                setCsrfToken('');
            }, 0);
        }

        // Initial auth check
        checkAuth();

        // MEDIUM FIX: Setup BroadcastChannel untuk sync antar tab
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            channelRef.current = new BroadcastChannel(CHANNEL_NAME);
            
            channelRef.current.onmessage = (event) => {
                const { type, token, isAdmin: adminStatus } = event.data;
                
                if (type === 'token-update' && token) {
                    // Update dari tab lain
                    setCsrfToken(token);
                    setIsAdmin(adminStatus);
                } else if (type === 'logout') {
                    // Tab lain logout, sync status
                    setIsAdmin(false);
                    setCsrfToken('');
                    window.location.href = '/?logged_out=true';
                }
            };
        }

        // MEDIUM FIX: Pause polling saat tab tidak visible
        let interval: NodeJS.Timeout;
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Pause - clear interval
                if (interval) clearInterval(interval);
            } else {
                // Resume - check auth dan setup interval
                checkAuth();
                interval = setInterval(() => checkAuth(), 60000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        interval = setInterval(() => checkAuth(), 60000);

        return () => {
            if (interval) clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (channelRef.current) {
                channelRef.current.close();
            }
        };
    }, [checkAuth]);

    return { isAdmin, csrfToken, isLoading, logout };
}
