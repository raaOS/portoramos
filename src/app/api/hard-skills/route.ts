import { hardSkillService } from '@/lib/services/hardSkillService';
import { validateAdminRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { HardSkill } from '@/types/hardSkill';

export async function GET() {
  const data = await hardSkillService.getHardSkills(true);
  return NextResponse.json(data.skills);
}

export async function POST(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
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

    return NextResponse.json({ success: true, count: skills.length });
  } catch (error) {
    console.error('Error saving hard skills:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
