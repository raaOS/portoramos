'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Baca CSRF token dari cookie secara fresh.
 * Return null saat SSR atau cookie tidak ada.
 */
function readCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find((c) => c.trim().startsWith('csrf_token='));
  if (!csrfCookie) return null;
  const value = csrfCookie.split('=')[1];
  return value ? decodeURIComponent(value) : null;
}

/**
 * Hook untuk mendapatkan CSRF token terkini dari cookie.
 *
 * STALE TOKEN FIX: Sebelumnya token dibaca sekali via `useMemo([], ...)` —
 * kalau `/api/admin/check-auth` refresh cookie, hook tetap return token basi
 * dan admin PUT akan 403. Sekarang:
 *  - Baca fresh saat mount
 *  - Re-check saat tab kembali visible
 *  - Dengarkan BroadcastChannel `admin-auth-sync` untuk update dari useAdminAuth
 *
 * @example
 * ```tsx
 * const csrfToken = useCsrfToken();
 * // Use in fetch headers: { 'X-CSRF-Token': csrfToken || '' }
 * ```
 */
export function useCsrfToken(): string | null {
  const [token, setToken] = useState<string | null>(() => readCsrfTokenFromCookie());

  const refresh = useCallback(() => {
    const current = readCsrfTokenFromCookie();
    setToken((prev) => (prev === current ? prev : current));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Refresh kalau user balik ke tab (cookie mungkin sudah di-refresh)
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Dengarkan sinkronisasi auth dari tab lain / useAdminAuth
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('admin-auth-sync');
        channel.onmessage = (event) => {
          const { type, token: incoming } = event.data || {};
          if (type === 'token-update' && typeof incoming === 'string') {
            setToken(incoming || null);
          } else if (type === 'logout') {
            setToken(null);
          }
        };
      } catch {
        channel = null;
      }
    }

    // Initial sync after mount via microtask — cookie bisa berubah antara
    // useState initializer dan effect pertama (hydration/check-auth response).
    // Dengan microtask kita tidak trigger cascading render dari body effect.
    queueMicrotask(refresh);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      channel?.close();
    };
  }, [refresh]);

  return token;
}
