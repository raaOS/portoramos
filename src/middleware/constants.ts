export const protectedRoutes = ['/admin', '/api/upload'];
export const publicRoutes = ['/admin/login'];

export const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 1000;
export const RATE_LIMIT_STRICT_ENDPOINTS: Record<string, number> = {
    '/api/auth': 10,
    '/api/admin': 200,
    '/api/projects': 500,
    '/api/about': 500,
    '/api/experience': 500,
    '/api/contact': 500,
};
