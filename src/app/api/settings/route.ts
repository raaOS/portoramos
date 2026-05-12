import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { validateAdminRequest } from '@/lib/auth';
import { updateSettingsSchema } from '@/lib/validations';

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

        const validation = updateSettingsSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid settings payload',
                details: validation.error.issues
            }, { status: 400 });
        }

        // Save only validated data to Firebase (prevents junk fields)
        await db.ref('settings').set(validation.data);

        return NextResponse.json({ success: true, settings: validation.data });
    } catch (error: unknown) {
        console.error('[API/Settings] POST Error:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
