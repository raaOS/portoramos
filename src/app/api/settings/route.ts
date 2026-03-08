import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { validateAdminRequest } from '@/lib/auth';

export async function getSettingsData() {
    try {
        const snap = await db.ref('settings').once('value');
        const data = snap.val();
        return data || { bannedWords: [] };
    } catch {
        return { bannedWords: [] };
    }
}

export async function GET(_request: NextRequest) {
    const data = await getSettingsData();
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    try {
        if (!(await validateAdminRequest(request))) {
            return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
        }
        const body = await request.json();

        // Validation simple
        if (!body.bannedWords || !Array.isArray(body.bannedWords)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        // Save to Firebase
        await db.ref('settings').set(body);

        return NextResponse.json({ success: true, settings: body });
    } catch (error: unknown) {
        console.error('[API/Settings] POST Error:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
