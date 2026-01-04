import { NextResponse } from 'next/server';
import { getHardSkills, saveHardSkills, HardSkill } from '@/lib/hard-skills';

export async function GET() {
  const skills = await getHardSkills();
  return NextResponse.json(skills);
}

export async function POST(request: Request) {
  try {
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
