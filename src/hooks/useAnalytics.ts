'use client';

import { useCallback } from 'react';

export const useAnalytics = () => {
    const trackEvent = useCallback(async (eventName: string, details?: any) => {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
