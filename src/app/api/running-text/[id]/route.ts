import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { runningTextService } from '@/lib/services/runningTextService';
import { validateAdminRequest } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Check admin authentication
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();

        const updatedItem = await runningTextService.updateItem(id, body);

        if (!updatedItem) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        revalidatePath('/', 'layout');

        return NextResponse.json(updatedItem);
    } catch {
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Check admin authentication
    if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const success = await runningTextService.deleteItem(id);

        if (!success) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
