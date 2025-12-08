import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { TestimonialData } from '@/types/testimonial';
import { checkAdminAuth } from '@/lib/auth';

const dataFilePath = path.join(process.cwd(), 'src/data/testimonial.json');
const backupFilePath = path.join(process.cwd(), 'src/data/testimonial.backup.json');

// GET - Read testimonials
export async function GET() {
  try {
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read testimonials' }, { status: 500 });
  }
}

// POST - Create new testimonial (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const newTestimonial = await request.json();

    // Read current data
    const data: TestimonialData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    // Create backup
    fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2));

    // Generate new ID
    const newId = Math.max(...data.testimonials.map(t => t.id), 0) + 1;

    // Add new testimonial
    const testimonialWithId = { ...newTestimonial, id: newId, isActive: newTestimonial.isActive !== undefined ? newTestimonial.isActive : true };
    data.testimonials.push(testimonialWithId);
    data.lastUpdated = new Date().toISOString();

    // Write updated data
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.json(testimonialWithId);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}

// PUT - Update testimonial (admin only)
export async function PUT(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, ...updatedTestimonial } = await request.json();

    // Read current data
    const data: TestimonialData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    // Create backup
    fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2));

    // Find and update testimonial
    const index = data.testimonials.findIndex(t => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    data.testimonials[index] = { ...data.testimonials[index], ...updatedTestimonial };
    data.lastUpdated = new Date().toISOString();

    // Write updated data
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.json(data.testimonials[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

// DELETE - Delete testimonial (admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    // Read current data
    const data: TestimonialData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    // Create backup
    fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2));

    // Remove testimonial
    data.testimonials = data.testimonials.filter(t => t.id !== id);
    data.lastUpdated = new Date().toISOString();

    // Write updated data
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
