import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateAdminRequest } from '@/lib/auth';
import { hardSkillService } from '@/lib/services/hardSkillService';
import { updateHardSkillSchema } from '@/lib/validations';

// PUT - update hard skill
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const validation = updateHardSkillSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid hard skill payload',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const updatedSkill = await hardSkillService.updateHardSkill(id, validation.data);

    if (!updatedSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Revalidate setelah sukses update agar halaman ISR /about fresh
    revalidatePath('/', 'layout');
    revalidatePath('/about');

    return NextResponse.json({ success: true, skill: updatedSkill });
  } catch (error) {
    console.error('Error updating hard skill:', error);
    return NextResponse.json({ error: 'Failed to update hard skill' }, { status: 500 });
  }
}

// DELETE - delete hard skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const { id } = await params;

    const success = await hardSkillService.deleteHardSkill(id);

    if (!success) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    revalidatePath('/', 'layout');
    revalidatePath('/about');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hard skill:', error);
    return NextResponse.json({ error: 'Failed to delete hard skill' }, { status: 500 });
  }
}
