import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { hardSkillService } from '@/lib/services/hardSkillService';
import { validateAdminRequest } from '@/lib/auth';
import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';
import { bulkUpdateHardSkillsSchema } from '@/lib/validations';

export async function GET() {
  const data = await hardSkillService.getHardSkills();
  return NextResponse.json(data.skills);
}

export async function POST(request: NextRequest) {
  try {
    // Auth check FIRST to prevent unauthenticated rate limit flooding
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    // Rate limit: 5 requests per minute for bulk updates
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = await checkFirebaseRateLimit(`hard_skills_post_${clientIp}`, 5, 60000, 300000);

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();

    // Validate with Zod — prevents malformed payload & injection
    const validation = bulkUpdateHardSkillsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid hard skills payload',
        details: validation.error.issues
      }, { status: 400 });
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
