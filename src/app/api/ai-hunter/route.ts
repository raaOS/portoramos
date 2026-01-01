import { NextRequest, NextResponse } from 'next/server';
import { aiHunterService } from '@/lib/services/aiHunterService';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const auth = await checkAdminAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await aiHunterService.getData();
    return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
    const auth = await checkAdminAuth(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { action, settings, jobId, jobUpdates } = body;

        if (action === 'updateSettings') {
            const newSettings = await aiHunterService.updateSettings(settings);
            return NextResponse.json({ settings: newSettings });
        }

        if (action === 'updateJob') {
            const updatedJob = await aiHunterService.updateJob(jobId, jobUpdates);
            return NextResponse.json({ job: updatedJob });
        }

        // Trigger high-level hunt simulation
        if (action === 'startHunt') {
            await aiHunterService.updateSettings({ isHunting: true, lastHuntTimestamp: new Date().toISOString() });
            // In a real scenario, this would trigger a background worker or serverless function
            // For now, we just update the status.
            return NextResponse.json({ success: true });
        }

        if (action === 'stopHunt') {
            await aiHunterService.updateSettings({ isHunting: false });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
