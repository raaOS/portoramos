import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { telegramStatusSchema } from '@/lib/validations';
import { validationError } from '@/lib/api-response';

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

    const validation = telegramStatusSchema.safeParse({ token });
    if (!validation.success) {
        return validationError(validation.error);
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
