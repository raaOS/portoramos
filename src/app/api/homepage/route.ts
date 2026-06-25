import { NextResponse } from 'next/server';
import { loadHomepageData } from '@/lib/loaders';

export const revalidate = 60;

export async function GET() {
  try {
    const data = await loadHomepageData();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('[API/Homepage] Failed to load homepage data:', error);
    return NextResponse.json({ error: 'Failed to load homepage data' }, { status: 500 });
  }
}
