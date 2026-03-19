import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { hardSkillService } from '@/lib/services/hardSkillService';
import { validateAdminRequest } from '@/lib/auth';
import { HardSkill } from '@/types/hardSkill';
import { checkFirebaseRateLimit } from '@/lib/firebaseRateLimit';

export async function GET() {
  const data = await hardSkillService.getHardSkills(true);
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

    const skills: HardSkill[] = await request.json();

    // Basic validation
    if (!Array.isArray(skills)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

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
