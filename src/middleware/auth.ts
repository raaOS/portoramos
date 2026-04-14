import { NextRequest, NextResponse } from 'next/server';
// Edge runtime constraints: Do not import 'jsonwebtoken' or 'crypto' here.
import { protectedRoutes, publicRoutes } from './constants';

export function checkAdminAuth(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublic = publicRoutes.some(route => pathname.startsWith(route));

    if (isProtected && !isPublic) {
        const allCookies = request.cookies.getAll().map(c => c.name).join(', ');
        const token =
            request.cookies.get('admin_token')?.value ||
            request.cookies.get('admin-token')?.value ||
            request.headers.get('authorization')?.replace('Bearer ', '');

        console.log(`[AUTH-DEBUG] Path: ${pathname} | Cookies keys seen: ${allCookies} | Token found: ${!!token}`);

        if (!token) {
            console.log(`[AUTH-DEBUG] No token found! Redirecting to login.`);
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            
            if (pathname.startsWith('/api/')) {
                return { authenticated: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
            }
            return { authenticated: false, response: NextResponse.redirect(loginUrl) };
        }
    }

    return { authenticated: true };
}
