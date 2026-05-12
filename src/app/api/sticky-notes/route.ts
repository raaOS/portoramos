import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { stickyNotesService } from '@/lib/services/stickyNotesService';
import { validateAdminRequest } from '@/lib/auth';
import { stickyNotesBulkSchema } from '@/lib/validations';
import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';

export async function GET(request: NextRequest) {
    try {
        console.log('[API/StickyNotes] GET request received');
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';

        const data = await stickyNotesService.getNotes(force);
        console.log(`[API/StickyNotes] Returning ${Array.isArray(data) ? data.length : 'non-array'} notes`);

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error) {
        console.error('Error loading sticky notes:', error);
        return NextResponse.json({ error: 'Failed to load sticky notes' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        if (!(await validateAdminRequest(request))) {
            return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
        }

        // Defense in depth: rate limit admin bulk writes meskipun auth sudah lolos.
        // 30 req/menit cukup untuk auto-save debounce tapi mencegah runaway loop.
        const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
        const rateLimit = await checkFirebaseRateLimit(
            `sticky_notes_put_${clientIp}`,
            30,
            60_000,
            300_000
        );
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }

        const body = await request.json();

        // Zod validation — cegah malformed payload & bound array size
        const validation = stickyNotesBulkSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid sticky notes payload',
                details: validation.error.issues
            }, { status: 400 });
        }

        const updatedData = await stickyNotesService.saveNotes(validation.data);

        revalidatePath('/', 'layout');

        return NextResponse.json({
            success: true,
            data: updatedData
        });
    } catch (error) {
        console.error('Error updating sticky notes:', error);
        return NextResponse.json({ error: 'Failed to update sticky notes' }, { status: 500 });
    }
}
