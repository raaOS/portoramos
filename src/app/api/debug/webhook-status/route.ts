import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

interface WebhookInfo {
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    ip_address?: string;
}

// GET - Check current webhook status
export async function GET(request: NextRequest) {
    if (!checkAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!BOT_TOKEN) {
        return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;
    const expectedWebhookUrl = `${baseUrl}/api/webhook/telegram`;

    try {
        // Get webhook info from Telegram
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
        const data = await res.json();

        if (!data.ok) {
            return NextResponse.json({ 
                ok: false, 
                error: data.description || 'Failed to get webhook info' 
            }, { status: 500 });
        }

        const webhookInfo: WebhookInfo = data.result;
        const currentUrl = webhookInfo.url || '';
        const isCorrect = currentUrl === expectedWebhookUrl;

        return NextResponse.json({
            ok: true,
            isCorrect,
            telegram: {
                url: currentUrl,
                pending_update_count: webhookInfo.pending_update_count || 0,
                has_custom_certificate: webhookInfo.has_custom_certificate
            },
            currentConfig: {
                expectedWebhookUrl
            }
        });
    } catch (error) {
        console.error('[Webhook Status] Error:', error);
        return NextResponse.json({ 
            ok: false, 
            error: 'Network error while checking webhook status' 
        }, { status: 500 });
    }
}

// POST - Fix/set the webhook URL
export async function POST(request: NextRequest) {
    if (!checkAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!BOT_TOKEN) {
        return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;
    const webhookUrl = `${baseUrl}/api/webhook/telegram`;

    try {
        // Set the webhook
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                max_connections: 40,
                allowed_updates: ['message', 'callback_query']
            })
        });

        const data = await res.json();

        if (!data.ok) {
            return NextResponse.json({ 
                success: false, 
                error: data.description || 'Failed to set webhook' 
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Webhook set successfully',
            url: webhookUrl
        });
    } catch (error) {
        console.error('[Webhook Status] Error setting webhook:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Network error while setting webhook' 
        }, { status: 500 });
    }
}
