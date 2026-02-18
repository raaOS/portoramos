'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to check if current user is authenticated as admin
 * Uses API call since admin_token cookie is HttpOnly and cannot be read by JS
 */
export function useAdminAuth() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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
            console.log('[Auth] Logged out successfully');

            // Give the browser a moment to process cookie deletions
            await new Promise(resolve => setTimeout(resolve, 800));

            // Hard redirect to clear all contexts and re-render everything as visitor
            window.location.href = '/?logged_out=true';
        } catch (e) {
            console.error('Logout failed, forcing redirect:', e);
            window.location.href = '/?logged_out=error';
        }
    };

    useEffect(() => {
        // Handle explicit logout param in URL
        if (typeof window !== 'undefined' && window.location.search.includes('logged_out=true')) {
            console.log('[Auth] Detected logout param - forcing client clear');
            setIsAdmin(false);
            setCsrfToken('');
        }

        // Check for admin auth via API (cookie is HttpOnly, can't read directly)
        const checkAuth = async () => {
            try {
                const res = await fetch(`/api/admin/check-auth?t=${Date.now()}`, {
                    credentials: 'include' // Send cookies with request
                });
                const data = await res.json();
                const authed = data.authenticated === true;
                setIsAdmin(authed);
                console.log(`[Auth] Admin Session: ${authed ? 'ACTIVE (Saves Enabled)' : 'INACTIVE (Visitor Mode)'}`);
                if (data.csrfToken) setCsrfToken(data.csrfToken);
                else if (!authed) setCsrfToken(''); // Clear token if no longer authed
            } catch (e) {
                console.error('Failed to check admin auth:', e);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();

        // Re-check periodically in case of login/logout
        const interval = setInterval(checkAuth, 60000); // Check every 60 seconds (less frequent to avoid clutter)
        return () => clearInterval(interval);
    }, []);

    return { isAdmin, csrfToken, isLoading, logout };
}
