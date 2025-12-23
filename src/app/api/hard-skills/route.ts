import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { hardSkillService } from '@/lib/services/hardSkillService';
import { HardSkillLevel } from '@/types/hardSkill';

// GET - list hard skills
export async function GET() {
  try {
    const data = await hardSkillService.getHardSkills();

    // Sort logic is now cleaner here or can be in service, but let's keep it consistent
    const sorted = data.skills
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));

    return NextResponse.json({
      skills: sorted,
      lastUpdated: data.lastUpdated,
    });
  } catch (error) {
    console.error('Error loading hard skills:', error);
    return NextResponse.json({ error: 'Failed to load hard skills' }, { status: 500 });
  }
}

// POST - create hard skill (admin)
export async function POST(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, iconUrl, level, order, description } = body ?? {};

    if (!name || !iconUrl) {
      return NextResponse.json({ error: 'Name and iconUrl are required' }, { status: 400 });
    }

    // Helper to normalize
    const normalizedLevel: HardSkillLevel =
      (level === 'Beginner' || level === 'Intermediate' || level === 'Advanced' || level === 'Expert')
        ? level
        : 'Intermediate';

    const newSkill = await hardSkillService.createHardSkill({
      name: String(name),
      iconUrl: String(iconUrl),
      level: normalizedLevel,
      order: typeof order === 'number' ? order : 0, // Service handles default order logic if we want, or here
      description: description ? String(description) : '',
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({ success: true, skill: newSkill });
  } catch (error) {
    console.error('Error creating hard skill:', error);
    return NextResponse.json({ error: 'Failed to create hard skill' }, { status: 500 });
  }
}
