import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { testimonialService } from '@/lib/services/testimonialService';
import { validateAdminRequest } from '@/lib/auth';
import {
  createTestimonialSchema,
  deleteTestimonialSchema,
  updateTestimonialSchema,
} from '@/lib/validations';
import { validationError } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

// GET - Read testimonials
export async function GET() {
  try {
    const data = await testimonialService.getTestimonials();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Failed to read testimonials' }, { status: 500 });
  }
}

// POST - Create new testimonial (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const rawBody = await request.json();
    const validationResult = createTestimonialSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return validationError(validationResult.error);
    }

    const newTestimonial = await testimonialService.createTestimonial(validationResult.data);

    revalidatePath('/', 'layout');
    revalidatePath('/about');

    return NextResponse.json({ success: true, testimonial: newTestimonial });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}

// PUT - Update testimonial (admin only)
export async function PUT(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const rawBody = await request.json();
    const validationResult = updateTestimonialSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return validationError(validationResult.error);
    }

    const { id, ...updates } = validationResult.data;
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

// DELETE - Delete testimonial (admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const rawBody = await request.json();
    const validationResult = deleteTestimonialSchema.safeParse(rawBody);

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
