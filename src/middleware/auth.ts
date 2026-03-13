import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { protectedRoutes, publicRoutes } from './constants';

export function checkAdminAuth(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
    const isPublic = publicRoutes.some(route => pathname.startsWith(route));

    if (isProtected && !isPublic) {
        const token =
            request.cookies.get('admin_token')?.value ||
            request.cookies.get('admin-token')?.value ||
            request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            if (pathname.startsWith('/api/')) {
                return { authenticated: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
            }
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return { authenticated: false, response: NextResponse.redirect(loginUrl) };
        }

        try {
            // ✅ FIX #1: Use proper JWT verification with signature check
            const isValid = verifyAdminToken(token);
            if (!isValid) {
                throw new Error('Invalid or expired token');
            }
        } catch (error) {
            console.error('Admin token check failed in middleware:', error);
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return { authenticated: false, response: NextResponse.redirect(loginUrl) };
        }
    }

    return { authenticated: true };
}
