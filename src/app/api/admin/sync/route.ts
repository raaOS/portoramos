import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
    try {
        // 1. Add all changes
        await execAsync('git add .');

        // 2. Commit
        try {
            await execAsync('git commit -m "Content Update: new assets/data from Admin Panel"');
        } catch (e: any) {
            // If nothing to commit (e.g. only untracked files were added, or no changes), standard git commit behavior might throw if clean.
            // If "nothing to commit" is in stdout, we can proceed. If it's a real error, rethrow.
            if (e.stdout && !e.stdout.includes('nothing to commit')) {
                console.log("Nothing to commit, creating empty commit to force trigger or just skipping?");
                // If nothing to commit, we can still try to push if there are committed changes not pushed.
                // Or just ignore.
            }
        }

        // 3. Push
        const { stdout, stderr } = await execAsync('git push');
        console.log('Push Output:', stdout);
        if (stderr) console.error('Push Stderr:', stderr); // git push writes to stderr sometimes even on success

        return NextResponse.json({
            success: true,
            message: 'Synced to GitHub & Triggered Vercel!'
        });

    } catch (error: any) {
        console.error('Git Sync Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Sync failed'
        }, { status: 500 });
    }
}
