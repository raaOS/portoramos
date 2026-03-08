import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        // 1. Fetch current settings from Firebase
        const snap = await db.ref('os-settings').once('value');
        const settings = snap.val();

        if (!settings || !settings.passwordHash) {
            // Fallback for first time setup or missing data
            return NextResponse.json({ error: 'System not initialized' }, { status: 500 });
        }

        // 2. Hash the incoming password
        const cleanPassword = password.toString().trim();
        const inputHash = crypto.createHash('sha256').update(cleanPassword).digest('hex');

        // 3. Compare
        if (inputHash.toLowerCase() === settings.passwordHash.toLowerCase()) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
        }

    } catch (error) {
        console.error('[VerifyPassword] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
