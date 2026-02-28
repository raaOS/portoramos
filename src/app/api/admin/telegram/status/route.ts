import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';

/* 
   This route is largely redundant with the GET in /config used with ?token= query param,
   but keeping it distinct for clear separation of concerns if we want to expand status checks later.
*/
export async function GET(request: NextRequest) {
    if (!checkAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ ok: false, error: 'Token is required' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data = await res.json();

        if (data.ok) {
            return NextResponse.json({
                ok: true,
                username: data.result.username,
                firstName: data.result.first_name
            });
        } else {
            return NextResponse.json({ ok: false, error: data.description });
        }
    } catch {
        return NextResponse.json({ ok: false, error: 'Network error' });
    }
}
