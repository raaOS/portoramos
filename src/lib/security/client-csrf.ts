/**
 * Client-side CSRF token utility.
 *
 * Membaca CSRF token dari cookie yang di-set oleh server.
 * Mendukung sync antar-tab melalui BroadcastChannel (lihat `useCsrfSync`).
 *
 * Hasil parsing cookie di-cache selama session agar tidak perlu
 * re-parse document.cookie di setiap render.
 *
 * @module client-csrf
 */

/** Cache untuk menghindari re-parse document.cookie setiap render. */
let _cachedToken: string | null = null;
let _cacheValid = false;

/**
 * Baca CSRF token dari cookie browser.
 *
 * @param fallback - Nilai fallback jika token tidak ditemukan
 * @returns CSRF token string, atau fallback jika tidak tersedia
 */
export function getWritableCsrfToken(fallback?: string | null): string {
  // Return cached value jika tersedia (client-side only)
  if (_cacheValid && _cachedToken !== null) {
    return _cachedToken;
  }

  if (typeof document === 'undefined') {
    return fallback || '';
  }

  const csrfCookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('csrf_token='));

  if (csrfCookie) {
    const token = decodeURIComponent(csrfCookie.slice('csrf_token='.length));
    // Cache the result
    _cachedToken = token;
    _cacheValid = true;
    return token;
  }

  return fallback || '';
}

/**
 * Invalidasi cache CSRF token.
 *
 * Panggil setelah token diperbarui (misalnya setelah login/logout
 * atau saat BroadcastChannel menerima update dari tab lain).
 */
export function invalidateCsrfCache(): void {
  _cachedToken = null;
  _cacheValid = false;
}
