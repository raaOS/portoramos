import { getHardSkills, saveHardSkills, HardSkill } from '@/lib/hard-skills';
import { validateAdminRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const skills = await getHardSkills(true);
  return NextResponse.json(skills);
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

    const success = await saveHardSkills(skills);

    if (success) {
      return NextResponse.json({ success: true, message: 'Skills saved successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to save skills' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
