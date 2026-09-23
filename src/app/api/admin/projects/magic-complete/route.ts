import { NextRequest, NextResponse } from 'next/server';
import { generateViralMetrics } from '@/lib/magic';
import { validateAdminRequest } from '@/lib/auth';
import { generateAiCommentsWithFallback } from './aiCommentsService';

export { generateAiCommentsWithFallback };

export async function POST(req: NextRequest) {
  if (!(await validateAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      slug,
      likes,
      shares,
      commentCount,
      tone,
      reply,
      projectTitle,
      projectDescription,
      cover,
      imageBase64,
    } = await req.json();

    const commentSlug = typeof slug === 'string' && slug.trim() ? slug.trim() : 'temp-slug';

    // 1. Calculate Metrics (in-memory only, no DB writes)
    const generatedMetrics = generateViralMetrics();
    const metrics = {
      likes: typeof likes === 'number' ? likes : generatedMetrics.likes,
      shares: typeof shares === 'number' ? shares : generatedMetrics.shares,
    };

    // 2. Generate Comments (in-memory only, no DB writes)
    const finalCommentCount = typeof commentCount === 'number' ? commentCount : 5;
    const finalReply = typeof reply === 'boolean' ? reply : true;

    // Generate context-aware AI comments (or fall back to mock comments)
    const newComments = await generateAiCommentsWithFallback({
      slug: commentSlug,
      count: finalCommentCount,
      tone: tone || 'casual',
      reply: finalReply,
      projectTitle,
      projectDescription,
      cover,
      imageBase64,
      reqUrl: req.url,
    });

    return NextResponse.json({
      success: true,
      metrics,
      commentCount: newComments.length,
      comments: newComments,
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
