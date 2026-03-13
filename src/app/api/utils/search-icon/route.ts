import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Normalize query: "Adobe Photoshop" -> "photoshop", "C++" -> "cplusplus" (special cases)
        let slug = query.toLowerCase().trim();

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
            'affinity': 'affinitydesigner', // default
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
            `https://cdn.simpleicons.org/${query.toLowerCase().replace(/ /g, '')}`
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
