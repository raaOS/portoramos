import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { ensureDataDir, loadData, saveData } from '@/lib/backup';
import { checkAdminAuth } from '@/lib/auth';
import { HardSkillConceptsData } from '@/types/hardSkillConcept';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'hardSkillConcepts.json');

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    await ensureDataDir();
    const data = ((await loadData(DATA_FILE)) as HardSkillConceptsData | null) || {
      concepts: [],
      lastUpdated: new Date().toISOString(),
    };

    const index = data.concepts.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    const concept = data.concepts[index];
    data.concepts[index] = {
      ...concept,
      title: body.title ?? concept.title,
      description: body.description ?? concept.description,
      order: typeof body.order === 'number' ? body.order : concept.order,
      updatedAt: new Date().toISOString(),
    };
    data.lastUpdated = new Date().toISOString();

    const success = await saveData(DATA_FILE, data);
    if (!success) {
      return NextResponse.json({ error: 'Failed to save concept' }, { status: 500 });
    }

    return NextResponse.json({ success: true, concept: data.concepts[index] });
  } catch (error) {
    console.error('Error updating hard skill concept:', error);
    return NextResponse.json({ error: 'Failed to update concept' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await ensureDataDir();
    const data = ((await loadData(DATA_FILE)) as HardSkillConceptsData | null) || {
      concepts: [],
      lastUpdated: new Date().toISOString(),
    };

    const initialLength = data.concepts.length;
    data.concepts = data.concepts.filter((c) => c.id !== id);

    if (data.concepts.length === initialLength) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    data.lastUpdated = new Date().toISOString();

    const success = await saveData(DATA_FILE, data);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete concept' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hard skill concept:', error);
    return NextResponse.json({ error: 'Failed to delete concept' }, { status: 500 });
  }
}
