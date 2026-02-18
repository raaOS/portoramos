'use client';

import { useCallback } from 'react';

const getCsrfToken = () => {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
};

export const useAnalytics = () => {
    const trackEvent = useCallback(async (eventName: string, details?: any) => {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken() || '',
                },
                body: JSON.stringify({
                    event: eventName,
                    details: details || {}
                }),
            });
        } catch (error) {
            console.error('Analytics Error:', error);
        }
    }, []);

    return { trackEvent };
};
