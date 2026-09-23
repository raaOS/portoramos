import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/auth';
import type { CategoryStats } from './categoryStats';
import { collectAllStorageReferences } from './storageCollectors';
import { buildCategoryList } from './storageBuilder';

export const runtime = 'nodejs';

interface StorageStatsResponse {
  categories: CategoryStats[];
  generatedAt: number;
  cached: boolean;
  warnings: string[];
}

const CACHE_TTL_MS = 30_000;
let cachedAt = 0;
let cachedPayload: StorageStatsResponse | null = null;
let inflight: Promise<StorageStatsResponse> | null = null;

async function runStats(): Promise<StorageStatsResponse> {
  const warnings: string[] = [];
  const refs = await collectAllStorageReferences(warnings);
  const categories = await buildCategoryList(refs, warnings);

  return {
    categories,
    generatedAt: Date.now(),
    cached: false,
    warnings,
  };
}

export async function GET(req: NextRequest) {
  try {
    if (!(await validateAdminRequest(req, { checkCsrf: false }))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fresh = req.nextUrl.searchParams.get('fresh') === 'true';
    const now = Date.now();

    if (!fresh && cachedPayload && now - cachedAt < CACHE_TTL_MS) {
      return NextResponse.json({ ...cachedPayload, cached: true });
    }

    if (!inflight) {
      inflight = runStats().finally(() => {
        inflight = null;
      });
    }
    const payload = await inflight;
    cachedPayload = payload;
    cachedAt = now;

    return NextResponse.json(payload);
  } catch (e) {
    console.error('[storage-stats] error:', e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Failed to compute storage stats',
      },
      { status: 500 }
    );
  }
}
