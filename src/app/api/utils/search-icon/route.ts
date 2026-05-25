import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import { enforceRequestRateLimit } from '@/lib/security/request';

export async function POST(req: NextRequest) {
  try {
    if (!(await validateAdminRequest(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = await enforceRequestRateLimit(
      req,
      'icon_search',
      20,
      60 * 1000,
      5 * 60 * 1000
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Normalize query: "Adobe Photoshop" -> "photoshop", "C++" -> "cplusplus" (special cases)
    let slug = query.slice(0, 80).toLowerCase().trim();

    // Common mappings
    const mappings: Record<string, string> = {
      'c++': 'cplusplus',
      'c#': 'csharp',
      'adobe photoshop': 'photoshop',
      'adobe illustrator': 'illustrator',
      'adobe after effects': 'aftereffects',
      'adobe xd': 'xd',
      'adobe premiere pro': 'premierepro',
      'affinity designer': 'affinitydesigner',
      'affinity photo': 'affinityphoto',
      'affinity publisher': 'affinitypublisher',
      affinity: 'affinitydesigner', // default
      'affinity by canva': 'affinitydesigner',
      'ms office': 'microsoft',
      'microsoft office': 'microsoft',
      'vs code': 'vscode',
      'visual studio code': 'vscode',
    };

    if (mappings[slug]) {
      slug = mappings[slug];
    } else {
      // Remove special chars for generic attempt
      slug = slug.replace(/[^\w]/g, '');
    }

    // Potential URLs to check
    const candidates = [
      // Simple Icons (JSDelivr - Reliable)
      `https://cdn.jsdelivr.net/npm/simple-icons@v14/icons/${slug}.svg`,
      // Simple Icons (Unpkg - Reliable)
      `https://unpkg.com/simple-icons@v14/icons/${slug}.svg`,
      // Simple Icons (Official CDN)
      `https://cdn.simpleicons.org/${slug}`,
      // Simple Icons (Fallback generic)
      `https://cdn.simpleicons.org/${slug.replace(/ /g, '')}`,
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok && res.headers.get('content-type')?.includes('image')) {
          return NextResponse.json({ iconUrl: url });
        }
      } catch {
        // Ignore and try next
      }
    }

    return NextResponse.json({ error: 'Icon not found', slug }, { status: 404 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
