/**
 * SSR-safe online status helpers untuk `useSyncExternalStore`.
 *
 * Mengapa pattern ini, bukan `useState(() => navigator.onLine)`?
 * useState initializer tetap dijalankan di server (typeof navigator undefined → return true)
 * DAN di client. Kalau client offline saat hydration, snapshot client (false) ≠ snapshot server (true)
 * sehingga React meng-emit "hydration mismatch" warning.
 *
 * `useSyncExternalStore` resmi dari React khusus untuk kasus ini:
 * snapshot server konstan (`true`), snapshot client bisa beda — React akan PATCH
 * client state setelah hydration tanpa mismatch warning.
 */

export function subscribeOnline(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function getOnlineSnapshot(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export function getOnlineServerSnapshot(): boolean {
  return true;
}
