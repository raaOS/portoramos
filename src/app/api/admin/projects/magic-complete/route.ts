import { NextRequest, NextResponse } from 'next/server';
import { generateViralMetrics, generateGenZComments } from '@/lib/magic';
import { validateAdminRequest } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
    if (!(await validateAdminRequest(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { projectId, slug } = await req.json();

        if (!projectId || !slug) {
            return NextResponse.json({ error: 'Missing projectId or slug' }, { status: 400 });
        }

        // 1. Update Project Metrics in Firebase
        const metrics = generateViralMetrics();
        const updatedProject = await projectService.updateProject(projectId, {
            id: projectId,
            ...metrics
        });

        if (!updatedProject) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // 2. Generate and Update Comments in Firebase
        // Since comments don't have a dedicated service yet, we use direct Firebase path
        const newComments = generateGenZComments(slug);
        await db.ref(`comments/${slug}`).set(newComments);

        return NextResponse.json({
            success: true,
            metrics,
            commentCount: newComments.length
        });

    } catch (error) {
        console.error('Magic Complete Error:', error instanceof Error ? error.message : error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to complete magic operation',
            details: error instanceof Error ? error.stack : 'Unknown error'
        }, { status: 500 });
    }
}
