export const protectedRoutes = ['/admin', '/api/upload'];
export const publicRoutes = ['/admin/login'];

// Note: RATE_LIMIT_* previously defined here was removed. Rate limiting is
// enforced inside mutating handlers via `enforceRequestRateLimit` /
// `checkFirebaseRateLimit`, not in the proxy — see `src/proxy.ts` comments.
