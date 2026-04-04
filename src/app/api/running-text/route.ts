import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { runningTextService } from '@/lib/services/runningTextService';
import { validateAdminRequest } from '@/lib/auth';
import {
    bulkUpdateRunningTextSchema,
    createRunningTextSchema,
} from '@/lib/validations';
import { validationError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    const fresh = request.nextUrl.searchParams.get('fresh') === 'true';
    const data = await runningTextService.getRunningTextData(fresh);
    // Sort by order
    data.items.sort((a, b) => a.order - b.order);
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    // Check admin authentication
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const rawBody = await request.json();
        const validationResult = createRunningTextSchema.safeParse(rawBody);

        if (!validationResult.success) {
            return validationError(validationResult.error);
        }

        const newItem = await runningTextService.createItem(
            validationResult.data.text,
            validationResult.data.order,
            validationResult.data.isActive
        );

        revalidatePath('/', 'layout');

        return NextResponse.json(newItem);
    } catch {
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    // Check admin authentication
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This is for bulk updates (ordering)
    try {
        const rawBody = await request.json();
        const validationResult = bulkUpdateRunningTextSchema.safeParse(rawBody);

        if (!validationResult.success) {
            return validationError(validationResult.error);
        }

        const updatedItems = await runningTextService.updateItems(validationResult.data.items);

        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, items: updatedItems });

    } catch {
        return NextResponse.json({ error: 'Failed to update items' }, { status: 500 });
    }
}
