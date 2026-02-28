import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { validateAdminRequest } from '@/lib/auth';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    try {
        // In production (Vercel), we don't have access to git CLI, nor should we commit local files.
        // Data updates are handled directly via githubService (API).
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({
                success: true,
                message: 'Sync handled via GitHub API (Git CLI skipped)'
            });
        }

        // 1. Add all changes
        await execAsync('git add .');

        // 2. Commit
        try {
            await execAsync('git commit -m "Content Update: new assets/data from Admin Panel"');
        } catch (error) {
            // If nothing to commit (e.g. only untracked files were added, or no changes), standard git commit behavior might throw if clean.
            // If "nothing to commit" is in stdout, we can proceed. If it's a real error, rethrow.
            if (error instanceof Error && error.message.includes('nothing to commit')) {
                // Nothing to commit, skipping commit
                // If nothing to commit, we can still try to push if there are committed changes not pushed.
                // Or just ignore.
            } else {
                throw error; // Re-throw real errors
            }
        }

        // 3. Push
        await execAsync('git push');
        // Silently handle git push output
        // git push writes to stderr sometimes even on success

        return NextResponse.json({
            success: true,
            message: 'Synced to GitHub & Triggered Vercel!'
        });

    } catch (error) {
        // Silently handle git sync errors
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Sync failed',
            details: error instanceof Error ? error.stack : 'Unknown error'
        }, { status: 500 });
    }
}
