import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { ensureDataDir, loadData, saveData } from '@/lib/backup';
import { checkAdminAuth } from '@/lib/auth';
import { HardSkill, HardSkillsData, HardSkillLevel } from '@/types/hardSkill';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'hardSkills.json');

const defaultData: HardSkillsData = {
  skills: [],
  lastUpdated: new Date().toISOString(),
};

function normaliseLevel(level?: string): HardSkillLevel {
  if (level === 'Beginner' || level === 'Intermediate' || level === 'Advanced' || level === 'Expert') {
    return level;
  }
  return 'Intermediate';
}

// GET - list hard skills
export async function GET() {
  try {
    await ensureDataDir();
    const data = ((await loadData(DATA_FILE)) as HardSkillsData | null) || defaultData;

    const sorted = data.skills
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));

    return NextResponse.json({
      skills: sorted,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
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

    await ensureDataDir();
    const data = ((await loadData(DATA_FILE)) as HardSkillsData | null) || defaultData;

    const newSkill: HardSkill = {
      id: `hard-${Date.now()}`,
      name: String(name),
      iconUrl: String(iconUrl),
      level: normaliseLevel(level),
      order: typeof order === 'number' ? order : data.skills.length + 1,
      description: description ? String(description) : '',
      isActive: body.isActive !== undefined ? body.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.skills.push(newSkill);
    data.lastUpdated = new Date().toISOString();

    const success = await saveData(DATA_FILE, data);
    if (!success) {
      return NextResponse.json({ error: 'Failed to save hard skill' }, { status: 500 });
    }

    return NextResponse.json({ success: true, skill: newSkill });
  } catch (error) {
    console.error('Error creating hard skill:', error);
    return NextResponse.json({ error: 'Failed to create hard skill' }, { status: 500 });
  }
}
