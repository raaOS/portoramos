'use client';

import { useCallback } from 'react';
import { getWritableCsrfToken } from '@/lib/security/client-csrf';

interface AnalyticsDetails {
  [key: string]: string | number | boolean | unknown;
}

/**
 * Hook untuk mengirim event analytics ke server.
 *
 * Menggunakan shared CSRF utility (`client-csrf`) alih-alih
 * parsing cookie secara manual — konsisten dengan admin hooks.
 *
 * @example
 * ```tsx
 * const { trackEvent } = useAnalytics();
 * trackEvent('button_click', { label: 'CTA Hero' });
 * ```
 */
export const useAnalytics = () => {
  const trackEvent = useCallback(async (eventName: string, details?: AnalyticsDetails) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getWritableCsrfToken() || '',
        },
        body: JSON.stringify({
          event: eventName,
          details: details || {},
        }),
      });
    } catch (error) {
      // Silent fail — analytics tidak boleh mengganggu UX
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Analytics] Track failed:', error);
      }
    }
  }, []);

  return { trackEvent };
};
