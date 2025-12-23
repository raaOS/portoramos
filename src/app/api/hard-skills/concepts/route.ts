import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { hardSkillConceptService } from '@/lib/services/hardSkillConceptService';

export async function GET() {
  try {
    const data = await hardSkillConceptService.getConcepts();
    const concepts = data.concepts
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title));

    return NextResponse.json({
      concepts,
      lastUpdated: data.lastUpdated,
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

    const newConcept = await hardSkillConceptService.createConcept({
      title: String(title),
      description: String(description),
      order: typeof order === 'number' ? order : 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    return NextResponse.json({ success: true, concept: newConcept });
  } catch (error) {
    console.error('Error creating hard skill concept:', error);
    return NextResponse.json({ error: 'Failed to create concept' }, { status: 500 });
  }
}
