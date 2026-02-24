import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getTelegramConfig } from '@/lib/telegram';
import { validateAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    if (!(await validateAdminRequest(request, { checkCsrf: false }))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tokenToCheck = searchParams.get('token');

    let token = tokenToCheck;
    let config = { botToken: '', chatId: '', isCustom: false };

    if (!token) {
        config = await getTelegramConfig() as any;
        token = config.botToken;
    }

    if (!token) {
        return NextResponse.json({ ok: false }); // Return empty config rather than error
    }

    // Return the config so the UI can populate
    return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { botToken, chatId } = body;

        if (!botToken || !chatId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const dataDir = path.join(process.cwd(), 'src/data');
        // Ensure data dir exists
        try {
            await fs.access(dataDir);
        } catch {
            await fs.mkdir(dataDir, { recursive: true });
        }

        const configFile = path.join(dataDir, 'telegram.json');
        await fs.writeFile(configFile, JSON.stringify({ botToken, chatId }, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to save telegram config:', error instanceof Error ? error.message : error);
        return NextResponse.json({
            error: 'Failed to save configuration',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
