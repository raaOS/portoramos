import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { validateAdminRequest } from '@/lib/auth';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ 
            success: false,
            error: 'Unauthorized or invalid CSRF token' 
        }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { action } = body;

        // In production (Vercel), git CLI is not available
        if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
            return NextResponse.json({
                success: true,
                message: 'Changes saved to local storage. Git sync available in development only.',
                note: 'Vercel deployment uses GitHub integration directly.'
            });
        }

        // Development: Use git CLI
        if (action === 'full-sync') {
            return await standardSync();
        }

        return await standardSync();

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

async function standardSync() {
    // 1. Add all changes
    await execAsync('git add .');

    // 2. Commit
    try {
        await execAsync('git commit -m "Content Update: new assets/data from Admin Panel"');
    } catch (error) {
        if (error instanceof Error && error.message.includes('nothing to commit')) {
            // Nothing to commit, still try to push existing commits
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
}
