import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { hardSkillService } from '@/lib/services/hardSkillService';

// PUT - update hard skill
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updatedSkill = await hardSkillService.updateHardSkill(id, body);

    if (!updatedSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, skill: updatedSkill });
  } catch (error) {
    console.error('Error updating hard skill:', error);
    return NextResponse.json({ error: 'Failed to update hard skill' }, { status: 500 });
  }
}

// DELETE - delete hard skill
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const success = await hardSkillService.deleteHardSkill(id);

    if (!success) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hard skill:', error);
    return NextResponse.json({ error: 'Failed to delete hard skill' }, { status: 500 });
  }
}
