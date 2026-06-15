import { NextRequest, NextResponse } from 'next/server';
import { generateViralMetrics, generateGenZComments } from '@/lib/magic';
import { validateAdminRequest } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';
import { db } from '@/lib/database';

export async function POST(req: NextRequest) {
  if (!(await validateAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { projectId, slug } = await req.json();

    if (!projectId || !slug) {
      return NextResponse.json({ error: 'Missing projectId or slug' }, { status: 400 });
    }

    // 1. Update Project Metrics in CLOUDFLARE_D1
    const metrics = generateViralMetrics();
    const updatedProject = await projectService.updateProject(projectId, {
      id: projectId,
      ...metrics,
    });

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Generate and Update Comments in CLOUDFLARE_D1
    // Since comments don't have a dedicated service yet, we use direct CLOUDFLARE_D1 path
    const newComments = generateGenZComments(slug);
    await db.ref(`comments/${slug}`).set(newComments);

    return NextResponse.json({
      success: true,
      metrics,
      commentCount: newComments.length,
    });
  } catch (error) {
    console.error('Magic Complete Error:', error instanceof Error ? error.message : error);
    // Log full error server-side only - do not expose stack trace to client
    return NextResponse.json(
      {
        error: 'Failed to complete magic operation',
      },
      { status: 500 }
    );
  }
}
