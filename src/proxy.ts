import { NextRequest } from 'next/server';
import { proxy as securityProxy } from './security';

export default function proxy(request: NextRequest) {
    return securityProxy(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - admin.html (static admin dashboard)
         */
        '/((?!_next/static|_next/image|favicon.ico|public/|admin\\.html).*)',
    ],
};
