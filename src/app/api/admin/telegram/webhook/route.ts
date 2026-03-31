import { NextRequest, NextResponse } from 'next/server';
import { buildTelegramWebhookSecret, getTelegramConfigInternal } from '@/lib/telegram';
import { validateAdminRequest } from '@/lib/auth';
import { telegramWebhookSchema } from '@/lib/validations';
import { validationError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }
    try {
        const body = await request.json().catch(() => ({}));
        const validation = telegramWebhookSchema.safeParse(body);

        if (!validation.success) {
            return validationError(validation.error);
        }

        const { url } = validation.data;
        const { botToken } = await getTelegramConfigInternal();

        if (!botToken) {
            return NextResponse.json({ error: 'Bot token not configured' }, { status: 400 });
        }

        const webhookUrl = `${url}/api/webhook/telegram`;
        const secretToken = buildTelegramWebhookSecret(botToken);

        const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                secret_token: secretToken
            })
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }
    try {
        const { botToken } = await getTelegramConfigInternal();
        if (!botToken) return NextResponse.json({ error: 'No token' }, { status: 400 });

        const dropPendingUpdates = request.nextUrl.searchParams.get('drop_pending_updates') === 'true';
        const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drop_pending_updates: dropPendingUpdates })
        });
        const data = await res.json();

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    if (!(await validateAdminRequest(request, { checkCsrf: false }))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check webhook info
    try {
        const { botToken } = await getTelegramConfigInternal();
        if (!botToken) return NextResponse.json({ error: 'No token' }, { status: 400 });

        const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const data = await res.json();

        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
