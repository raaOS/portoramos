import { NextRequest, NextResponse } from 'next/server';
import { stickyNotesService } from '@/lib/services/stickyNotesService';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';

        const data = await stickyNotesService.getNotes(force);
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
        // Sticky notes don't necessarily have to be admin only if we want the user to play with them, 
        // BUT for persistent sync across environments that saves to REPO, it MUST be admin only or it will cause PR noise.
        // Given this specific portfolio context, Sticky Notes are meant to be private notes for the owner or semi-public.
        // The user's request implies they want these synced like other CRUDs.
        if (!checkAdminAuth(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const updatedData = await stickyNotesService.saveNotes(body);

        return NextResponse.json({
            success: true,
            data: updatedData
        });
    } catch (error) {
        console.error('Error updating sticky notes:', error);
        return NextResponse.json({ error: 'Failed to update sticky notes' }, { status: 500 });
    }
}
