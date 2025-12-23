import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { hardSkillConceptService } from '@/lib/services/hardSkillConceptService';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await hardSkillConceptService.updateConcept(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, concept: updated });
  } catch (error) {
    console.error('Error updating hard skill concept:', error);
    return NextResponse.json({ error: 'Failed to update concept' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const success = await hardSkillConceptService.deleteConcept(id);

    if (!success) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hard skill concept:', error);
    return NextResponse.json({ error: 'Failed to delete concept' }, { status: 500 });
  }
}
