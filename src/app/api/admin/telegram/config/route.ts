import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getTelegramConfig } from '@/lib/telegram';

export async function GET(request: Request) {
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

export async function POST(request: Request) {
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
        console.error('Failed to save telegram config:', error);
        return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
    }
}
