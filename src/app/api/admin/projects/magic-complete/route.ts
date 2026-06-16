import { NextRequest, NextResponse } from 'next/server';
import { generateGenZComments, generateViralMetrics } from '@/lib/magic';
import { validateAdminRequest } from '@/lib/auth';
import { projectService } from '@/lib/services/projectService';
import { db } from '@/lib/database';

export async function POST(req: NextRequest) {
  if (!(await validateAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      projectId, 
      slug, 
      likes, 
      shares, 
      commentCount, 
      tone, 
      reply 
    } = await req.json();

    if (!projectId || !slug) {
      return NextResponse.json({ error: 'Missing projectId or slug' }, { status: 400 });
    }

    // 1. Update Project Metrics in CLOUDFLARE_D1
    const generatedMetrics = generateViralMetrics();
    const metrics = {
      likes: typeof likes === 'number' ? likes : generatedMetrics.likes,
      shares: typeof shares === 'number' ? shares : generatedMetrics.shares,
    };

    const updatedProject = await projectService.updateProject(projectId, {
      id: projectId,
      ...metrics,
    });

    if (!updatedProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Generate and Update Comments in CLOUDFLARE_D1
    const finalCommentCount = typeof commentCount === 'number' ? commentCount : 5;
    const finalReply = typeof reply === 'boolean' ? reply : true;

    const hasCustomViralArgs = 
      likes !== undefined || 
      shares !== undefined || 
      commentCount !== undefined || 
      tone !== undefined || 
      reply !== undefined;

    const newComments = hasCustomViralArgs
      ? generateGenZComments(slug, finalCommentCount, tone, finalReply)
      : generateGenZComments(slug);
    await db.ref(`comments/${slug}`).set(newComments);

    return NextResponse.json({
      success: true,
      metrics,
      commentCount: newComments.length,
    });
  } catch (error) {
    console.error('Magic Complete Error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        error: 'Failed to complete magic operation',
      },
      { status: 500 }
    );
  }
}
