import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateAdminRequest } from '@/lib/auth';
import { aboutService } from '@/lib/services/aboutService';
import aboutDataFallback from '@/data/about.json';
import { updateDesignPhilosophySchema } from '@/lib/validations';

// GET Handler - Return Design Philosophy section
export async function GET() {
    try {
        const aboutData = await aboutService.getAboutData();
        const philosophy = aboutData.designPhilosophy;

        const result = {
            heading: philosophy?.heading
                || aboutDataFallback.designPhilosophy?.heading
                || 'Design Philosophy',
            subheading: philosophy?.subheading
                || aboutDataFallback.designPhilosophy?.subheading
                || 'Strategic Thinking Framework',
            workflowSteps: philosophy?.workflowSteps
                || aboutDataFallback.designPhilosophy?.workflowSteps
                || [],
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to fetch Design Philosophy:', error);
        return NextResponse.json({
            heading: aboutDataFallback.designPhilosophy?.heading || 'Design Philosophy',
            subheading: aboutDataFallback.designPhilosophy?.subheading || 'Strategic Thinking Framework',
            workflowSteps: aboutDataFallback.designPhilosophy?.workflowSteps || [],
        });
    }
}

// POST Handler (Update) - Route via aboutService so cache stays consistent
export async function POST(request: NextRequest) {
    try {
        if (!(await validateAdminRequest(request))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const validation = updateDesignPhilosophySchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid design philosophy payload',
                details: validation.error.issues,
            }, { status: 400 });
        }

        // CACHE-CONSISTENCY FIX: tulis via aboutService.updateAboutData sehingga
        // contentCache(`firebase:content/about`) ikut ter-invalidate dan realtime
        // sync tetap akurat. Sebelumnya bypass service bikin cache stale sampai TTL.
        await aboutService.updateAboutData({
            designPhilosophy: validation.data,
        });

        // ISR revalidation — /about pakai revalidate = 60
        revalidatePath('/', 'layout');
        revalidatePath('/about');

        return NextResponse.json({
            success: true,
            data: validation.data,
            message: 'Data berhasil disimpan',
        });
    } catch (error) {
        console.error('Failed to update Design Philosophy:', error);
        return NextResponse.json(
            { error: 'Failed to update data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
