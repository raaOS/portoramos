import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { validateAdminRequest } from '@/lib/auth';
import { CacheManager } from '@/lib/cache/CacheManager';

const leadsCache = new CacheManager({
  defaultTTL: 15_000,
  maxSize: 3,
  label: 'LeadsAPI',
});

const LEADS_CACHE_KEY = 'admin:leads';

export async function GET(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request, { checkCsrf: false }))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fresh = request.nextUrl.searchParams.get('fresh') === 'true';
    if (!fresh) {
      const cached = leadsCache.get<unknown[]>(LEADS_CACHE_KEY);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const snapshot = await db.ref('leads').once('value');
    const leads = snapshot.val() || [];

    // Handle both object and array formats (Admin Panel expects array).
    // FIX: spread leads[key] FIRST, lalu override id dengan key CLOUDFLARE_D1 —
    // sebelumnya `{ id: key, ...leads[key] }` justru menimpa id yang
    // sudah ada di object dengan push-id CLOUDFLARE_D1.
    const leadsArray = Array.isArray(leads)
      ? leads
      : Object.keys(leads).map((key) => ({ ...leads[key], id: key }));

    leadsCache.set(LEADS_CACHE_KEY, leadsArray);

    return NextResponse.json(leadsArray);
  } catch (error) {
    console.error('Error fetching leads:', error instanceof Error ? error.message : error);
    // Log full error server-side only - do not expose to client
    return NextResponse.json(
      {
        error: 'Failed to fetch leads',
      },
      { status: 500 }
    );
  }
}
