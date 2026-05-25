export function getWritableCsrfToken(fallback?: string | null): string {
  if (typeof document === 'undefined') {
    return fallback || '';
  }

  const csrfCookie = document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('csrf_token='));

  if (csrfCookie) {
    return decodeURIComponent(csrfCookie.slice('csrf_token='.length));
  }

  return fallback || '';
}
