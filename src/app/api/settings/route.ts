import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'settings.json');
const GITHUB_PATH = 'src/data/settings.json';

export async function getSettingsData() {
    const isDev = process.env.NODE_ENV === 'development';
    let data = null;

    if (isDev) {
        await ensureDataDir();
        data = await loadData(DATA_FILE);
    } else {
        try {
            const ghData = await githubService.getFileContent(GITHUB_PATH);
            data = ghData.content;
        } catch (error) {
            console.warn('Failed to fetch settings from GitHub:', error);
        }
    }

    if (!data) {
        data = { bannedWords: [] };
    }
    return data;
}

export async function GET(request: NextRequest) {
    const data = await getSettingsData();
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validation simple
        if (!body.bannedWords || !Array.isArray(body.bannedWords)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const isDev = process.env.NODE_ENV === 'development';

        // Save
        if (isDev) {
            await ensureDataDir();
            await saveData(DATA_FILE, body);
        } else {
            await githubService.updateFile(GITHUB_PATH, body, 'Update settings');
        }

        return NextResponse.json({ success: true, settings: body });
    } catch (error) {
        console.error('Error saving settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
