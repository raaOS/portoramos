import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { ensureDataDir, loadData, saveData } from '@/lib/backup';
import { checkAdminAuth } from '@/lib/auth';
import { HardSkillsData, HardSkillLevel } from '@/types/hardSkill';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'hardSkills.json');

function normaliseLevel(level?: string): HardSkillLevel | undefined {
  if (level === 'Beginner' || level === 'Intermediate' || level === 'Advanced' || level === 'Expert') {
    return level;
  }
  return undefined;
}

// PUT - update hard skill
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    await ensureDataDir();
    const data = ((await loadData(DATA_FILE)) as HardSkillsData | null) || { skills: [], lastUpdated: new Date().toISOString() };

    const index = data.skills.findIndex((skill) => skill.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const skill = data.skills[index];
    const nextLevel = normaliseLevel(body.level);

    data.skills[index] = {
      ...skill,
      name: body.name ?? skill.name,
      iconUrl: body.iconUrl ?? skill.iconUrl,
      level: nextLevel ?? skill.level,
      order: typeof body.order === 'number' ? body.order : skill.order,
      description: body.description !== undefined ? body.description : skill.description,
      updatedAt: new Date().toISOString(),
    };

    data.lastUpdated = new Date().toISOString();

    const success = await saveData(DATA_FILE, data);
    if (!success) {
      return NextResponse.json({ error: 'Failed to save hard skill' }, { status: 500 });
    }

    return NextResponse.json({ success: true, skill: data.skills[index] });
  } catch (error) {
    console.error('Error updating hard skill:', error);
    return NextResponse.json({ error: 'Failed to update hard skill' }, { status: 500 });
  }
}

// DELETE - delete hard skill
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await ensureDataDir();
    const data = ((await loadData(DATA_FILE)) as HardSkillsData | null) || { skills: [], lastUpdated: new Date().toISOString() };

    const initialLength = data.skills.length;
    data.skills = data.skills.filter((skill) => skill.id !== id);

    if (data.skills.length === initialLength) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    data.lastUpdated = new Date().toISOString();

    const success = await saveData(DATA_FILE, data);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete hard skill' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hard skill:', error);
    return NextResponse.json({ error: 'Failed to delete hard skill' }, { status: 500 });
  }
}
