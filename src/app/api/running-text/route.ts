import { NextRequest, NextResponse } from 'next/server';
import { runningTextService } from '@/lib/services/runningTextService';
import { validateAdminRequest } from '@/lib/auth';

export async function GET() {
    const data = await runningTextService.getRunningTextData();
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
        const body = await request.json();
        const { text, order, isActive } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        const newItem = await runningTextService.createItem(
            text,
            order,
            isActive
        );

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
        const body = await request.json();
        const { items } = body;

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
        }

        const updatedItems = await runningTextService.updateItems(items);

        return NextResponse.json({ success: true, items: updatedItems });

    } catch {
        return NextResponse.json({ error: 'Failed to update items' }, { status: 500 });
    }
}
