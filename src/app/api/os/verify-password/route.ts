import { NextResponse } from 'next/server';
import { githubService } from '@/lib/github';
import crypto from 'crypto';

const SETTINGS_PATH = 'src/data/os-settings.json';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        // 1. Fetch current settings (from GitHub in Prod, Local in Dev)
        // We use githubService because it already handles the Local FS fallback.
        const { content: settings } = await githubService.getFileContent<{ passwordHash: string }>(SETTINGS_PATH, false);

        // 2. Hash the incoming password
        const cleanPassword = password.toString().trim();
        const inputHash = crypto.createHash('sha256').update(cleanPassword).digest('hex');

        // Security: Never log password or hash values

        // 3. Compare (Case insensitive compare just in case)
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
