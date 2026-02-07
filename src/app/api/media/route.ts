import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return new Response('URL required', { status: 400 });
    }

    // Only allow GitHub raw content URLs for security
    if (!url.includes('raw.githubusercontent.com') && !url.startsWith('/assets/')) {
        return new Response('Invalid media source', { status: 403 });
    }

    try {
        // We use a longer revalidation for media
        const response = await fetch(url, {
            next: {
                revalidate: 86400 // Cache for 24 hours in Next.js Data Cache
            }
        });

        if (!response.ok) {
            return new Response('Media not found', { status: 404 });
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Set aggressive browser/CDN cache headers
        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable', // 1 year cache for immutable assets
                'X-Proxy-Cache': 'HIT',
            },
        });
    } catch (error) {
        console.error('[MediaProxy] Error fetching media:', error);
        return new Response('Error fetching media', { status: 500 });
    }
}
