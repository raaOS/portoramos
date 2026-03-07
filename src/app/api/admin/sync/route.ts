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
        // In production (Vercel), we don't have access to git CLI
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
            // If nothing to commit, that's ok
            if (error instanceof Error && error.message.includes('nothing to commit')) {
                // Continue to push
            } else {
                throw error;
            }
        }

        // 3. Push with retry
        let pushAttempts = 0;
        const maxAttempts = 3;
        let lastError = null;
        
        while (pushAttempts < maxAttempts) {
            try {
                await execAsync('git push');
                lastError = null;
                break;
            } catch (error) {
                pushAttempts++;
                lastError = error;
                
                if (error instanceof Error && error.message.includes('cannot lock ref')) {
                    if (pushAttempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * pushAttempts));
                        continue;
                    }
                }
                throw error;
            }
        }
        
        if (lastError) {
            throw lastError;
        }

        return NextResponse.json({
            success: true,
            message: 'Synced to GitHub & Triggered Vercel!'
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Sync failed';
        console.error('[Sync Error]', error);
        
        const isLockError = errorMessage.includes('cannot lock ref');
        
        return NextResponse.json({
            success: false,
            error: isLockError 
                ? 'GitHub sedang sibuk. Data sudah tersimpan lokal, coba sync lagi dalam beberapa detik.'
                : errorMessage,
            retryable: isLockError
        }, { status: isLockError ? 503 : 500 });
    }
}
