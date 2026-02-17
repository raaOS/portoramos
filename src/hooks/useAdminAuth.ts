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

    useEffect(() => {
        // Check for admin auth via API (cookie is HttpOnly, can't read directly)
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/admin/check-auth', {
                    credentials: 'include' // Send cookies with request
                });
                const data = await res.json();
                const authed = data.authenticated === true;
                setIsAdmin(authed);
                console.log(`[Auth] Admin Session: ${authed ? 'ACTIVE (Saves Enabled)' : 'INACTIVE (Visitor Mode)'}`);
                if (data.csrfToken) setCsrfToken(data.csrfToken);
            } catch (e) {
                console.error('Failed to check admin auth:', e);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();

        // Re-check periodically in case of login/logout
        const interval = setInterval(checkAuth, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, []);

    return { isAdmin, csrfToken, isLoading };
}
