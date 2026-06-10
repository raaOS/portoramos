import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { hardSkillService } from '@/lib/services/hardSkillService';
import { validateAdminRequest } from '@/lib/auth';
import { enforceRequestRateLimit } from '@/lib/security/request';
import { bulkUpdateHardSkillsSchema } from '@/lib/validations';

export async function GET() {
  try {
    const data = await hardSkillService.getHardSkills();
    return NextResponse.json(data.skills);
  } catch (error) {
    console.error('Error loading hard skills:', error);
    return NextResponse.json({ error: 'Failed to load hard skills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check FIRST to prevent unauthenticated rate limit flooding
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    // Rate limit: 5 requests per minute for bulk updates
    const rateLimit = await enforceRequestRateLimit(
      request,
      'hard_skills_post',
      5,
      60_000,
      300_000
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
      );
    }

    const body = await request.json();

    // Validate with Zod — prevents malformed payload & injection
    const validation = bulkUpdateHardSkillsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid hard skills payload',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const skills = validation.data;

    // Save
    const success = await hardSkillService.saveHardSkills(skills, 'Bulk update via Admin API');

    if (!success) {
      return NextResponse.json({ error: 'Failed to save skills' }, { status: 500 });
    }

    revalidatePath('/', 'layout');
    revalidatePath('/about');

    return NextResponse.json({ success: true, count: skills.length });
  } catch (error) {
    console.error('Error saving hard skills:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
