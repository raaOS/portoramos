import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { ensureDataDir, loadData, saveData } from '@/lib/backup';
import { checkAdminAuth } from '@/lib/auth';
import { HardSkillConcept, HardSkillConceptsData } from '@/types/hardSkillConcept';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'hardSkillConcepts.json');

const defaultData: HardSkillConceptsData = {
  concepts: [],
  lastUpdated: new Date().toISOString(),
};

export async function GET() {
  try {
    await ensureDataDir();
    const data = ((await loadData(DATA_FILE)) as HardSkillConceptsData | null) || defaultData;
    const concepts = data.concepts
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title));

    return NextResponse.json({
      concepts,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error loading hard skill concepts:', error);
    return NextResponse.json({ error: 'Failed to load hard skill concepts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, order } = body ?? {};

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    await ensureDataDir();
    const data = ((await loadData(DATA_FILE)) as HardSkillConceptsData | null) || defaultData;

    const newConcept: HardSkillConcept = {
      id: `concept-${Date.now()}`,
      title: String(title),
      description: String(description),
      order: typeof order === 'number' ? order : data.concepts.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.concepts.push(newConcept);
    data.lastUpdated = new Date().toISOString();

    const success = await saveData(DATA_FILE, data);
    if (!success) {
      return NextResponse.json({ error: 'Failed to save concept' }, { status: 500 });
    }

    return NextResponse.json({ success: true, concept: newConcept });
  } catch (error) {
    console.error('Error creating hard skill concept:', error);
    return NextResponse.json({ error: 'Failed to create concept' }, { status: 500 });
  }
}
