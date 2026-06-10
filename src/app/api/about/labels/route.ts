import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/services/contentService';
import { validateAdminRequest } from '@/lib/auth';
import labelsFallback from '@/data/labels.json';
import { Label } from '@/types/labels';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validationError } from '@/lib/api-response';

const labelSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  color: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
});

const labelsArraySchema = z.array(labelSchema).max(200);

const service = new ContentService<Label[]>('labels.json', labelsFallback as Label[]);

async function getLabels() {
  return await service.getData();
}

async function saveLabels(data: Label[]) {
  return await service.saveData(data);
}

export async function GET() {
  try {
    const labels = await getLabels();
    return NextResponse.json(labels);
  } catch (_error) {
    console.error('Failed to fetch labels:', _error);
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const body = await request.json();

    const validation = labelsArraySchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error);
    }

    await saveLabels(validation.data);

    // Wait for cache revalidation and broadcast
    await Promise.all([revalidatePath('/', 'layout')]);

    return NextResponse.json({ success: true, data: body });
  } catch (_error) {
    console.error('Failed to update labels:', _error);
    return NextResponse.json({ error: 'Failed to update labels' }, { status: 500 });
  }
}
