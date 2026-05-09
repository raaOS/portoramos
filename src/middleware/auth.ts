import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { protectedRoutes, publicRoutes } from './constants';

export async function checkAdminAuth(request: NextRequest) {
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

        let isValid = false;
        if (token) {
            try {
                const secret = process.env.JWT_SECRET;
                if (secret) {
                    const secretKey = new TextEncoder().encode(secret);
                    const { payload } = await jwtVerify(token, secretKey, {
                        issuer: 'portfolio-admin',
                        audience: 'admin-panel'
                    });
                    if (payload && payload.sub === 'admin') {
                        isValid = true;
                    }
                } else {
                    console.error('[AUTH-DEBUG] JWT_SECRET is not configured in environment variables');
                }
            } catch (_err) {
                console.error(`[AUTH-DEBUG] JWT Verification failed`);
            }
        }

        if (!isValid) {
            console.log(`[AUTH-DEBUG] Token invalid or missing! Redirecting to login.`);
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
