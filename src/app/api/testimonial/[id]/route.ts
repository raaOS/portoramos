import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { testimonialService } from '@/lib/services/testimonialService';
import { validateAdminRequest } from '@/lib/auth';
import { deleteTestimonialSchema, updateTestimonialSchema } from '@/lib/validations';
import { validationError } from '@/lib/api-response';

/**
 * REST-correct endpoint pattern (`/api/testimonial/[id]`) untuk mutation
 * per-resource. Endpoint lama `/api/testimonial` (DELETE via body JSON)
 * tetap dipertahankan agar tidak memecah client existing — tapi caller
 * baru sebaiknya pakai endpoint ini supaya tidak kena CDN/proxy yang
 * strip body pada request DELETE.
 */

// PUT - Update testimonial
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const { id } = await params;
    const rawBody = await request.json();
    const validationResult = updateTestimonialSchema.safeParse({ ...rawBody, id });
    if (!validationResult.success) {
      return validationError(validationResult.error);
    }

    const { id: _validatedId, ...updates } = validationResult.data;
    const updated = await testimonialService.updateTestimonial(id, updates);

    if (!updated) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    revalidatePath('/', 'layout');
    revalidatePath('/about');

    return NextResponse.json({ success: true, testimonial: updated });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

// DELETE - Delete testimonial
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const { id } = await params;
    const validationResult = deleteTestimonialSchema.safeParse({ id });
    if (!validationResult.success) {
      return validationError(validationResult.error);
    }

    const success = await testimonialService.deleteTestimonial(validationResult.data.id);

    if (!success) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    revalidatePath('/', 'layout');
    revalidatePath('/about');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
