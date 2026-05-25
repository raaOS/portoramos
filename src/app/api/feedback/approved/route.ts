import { NextRequest } from 'next/server';
import { db } from '@/lib/database';
import { success, serverError } from '@/lib/api-response';
import { CacheManager } from '@/lib/cache/CacheManager';

/**
 * GET /api/feedback/approved
 *
 * Public-safe endpoint — hanya return feedback yang status='approved' DAN
 * isPublic=true. Field sensitif (IP, userAgent, clientId, email-like data)
 * di-strip sebelum dikirim ke client.
 *
 * Dipakai nanti untuk render "testimonial wall" / section feedback di halaman
 * publik tanpa butuh admin auth.
 *
 * Query params:
 *  - limit: max items (default 20, max 100)
 *  - minRating: filter feedback dengan rating >= nilai ini (default 4)
 */

const approvedCache = new CacheManager({
  defaultTTL: 60_000, // 1 menit — cukup fresh, nggak spam CLOUDFLARE_D1
  maxSize: 8,
  label: 'FeedbackApprovedAPI',
});

interface ApprovedFeedbackDoc {
  rating: number;
  message?: string;
  name?: string;
  fromPath?: string;
  source?: string;
  status?: string;
  isPublic?: boolean;
  createdAt?: string;
  createdAtMs?: number;
}

interface PublicFeedback {
  id: string;
  rating: number;
  name: string;
  message: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 1), 100);
    const minRating = Math.min(
      Math.max(parseInt(searchParams.get('minRating') ?? '4', 10) || 4, 1),
      5
    );
    const cacheKey = `approved:${limit}:${minRating}`;

    const cached = approvedCache.get<PublicFeedback[]>(cacheKey);
    if (cached) {
      return success({ feedback: cached, cached: true });
    }

    // Query: ambil bucket cukup banyak untuk difilter (CLOUDFLARE_D1 RTDB query
    // simple, filter sisanya di memory). Kalau volume tembus 10k+, pindahin
    // ke backend indexed query atau tambah indeks compound.
    const snap = await db
      .ref('feedback')
      .orderByChild('createdAtMs')
      .limitToLast(500)
      .once('value');
    const raw = snap.val() as Record<string, ApprovedFeedbackDoc> | null;

    const all: PublicFeedback[] = [];
    if (raw) {
      for (const [id, doc] of Object.entries(raw)) {
        if (doc.status !== 'approved') continue;
        if (!doc.isPublic) continue;
        if (typeof doc.rating !== 'number' || doc.rating < minRating) continue;

        all.push({
          id,
          rating: doc.rating,
          name: doc.name || 'Anonymous',
          message: doc.message || '',
          createdAt: doc.createdAt || new Date(doc.createdAtMs ?? 0).toISOString(),
        });
      }
    }

    // Sort terbaru dulu, lalu slice ke limit
    all.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    const result = all.slice(0, limit);

    approvedCache.set(cacheKey, result);
    return success({ feedback: result, cached: false });
  } catch (error) {
    console.error(
      '[API /feedback/approved GET] Error:',
      error instanceof Error ? error.message : error
    );
    return serverError('Failed to load feedback');
  }
}
