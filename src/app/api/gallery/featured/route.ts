import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { galleryFeaturedService } from '@/lib/services/galleryFeaturedService';
import { validateAdminRequest } from '@/lib/auth';
import { galleryFeaturedSchema } from '@/lib/validations';
import { enforceRequestRateLimit } from '@/lib/security/request';

export async function GET() {
  try {
    const data = await galleryFeaturedService.getFeaturedData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading gallery data:', error);
    return NextResponse.json({ featuredProjectIds: [], lastUpdated: new Date().toISOString() });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    // Rate limit: 10 req/menit per IP. Gallery featured list jarang diubah.
    const rateLimit = await enforceRequestRateLimit(
      request,
      'gallery_featured',
      10,
      60_000,
      300_000
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const body = await request.json();

    const validation = galleryFeaturedSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid gallery payload',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // De-duplicate IDs sebelum save
    const uniqueIds = Array.from(new Set(validation.data.featuredProjectIds));

    const newData = await galleryFeaturedService.updateFeaturedData(uniqueIds);

    revalidatePath('/', 'layout');
    revalidatePath('/projects');

    return NextResponse.json({ success: true, data: newData });
  } catch (error) {
    console.error('Error updating gallery data:', error);
    return NextResponse.json({ error: 'Failed to update gallery data' }, { status: 500 });
  }
}
