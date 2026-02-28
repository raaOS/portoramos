import { NextRequest, NextResponse } from 'next/server';
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
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error('Invalid token format');

            const payloadSegment = parts[1];
            const padded = payloadSegment.padEnd(
                payloadSegment.length + ((4 - (payloadSegment.length % 4)) % 4),
                '='
            );
            const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
            const json = atob(base64);
            const payload = JSON.parse(json) as { sub?: string; exp?: number };

            if (payload.sub !== 'admin') throw new Error('Invalid subject');

            if (typeof payload.exp === 'number') {
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp <= now) throw new Error('Token expired');
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
