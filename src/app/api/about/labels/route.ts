import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/services/contentService';
import { validateAdminRequest } from '@/lib/auth';
import labelsFallback from '@/data/labels.json';
import { Label } from '@/types/labels';
import { revalidatePath } from 'next/cache';

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
        return NextResponse.json(
            { error: 'Failed to fetch labels' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        if (!(await validateAdminRequest(request))) {
            return NextResponse.json(
                { error: 'Unauthorized or invalid CSRF token' },
                { status: 401 }
            );
        }

        const body = await request.json();
        
        // Save the updated labels
        await saveLabels(body);
        
        // Wait for cache revalidation and broadcast
        await Promise.all([
            revalidatePath('/', 'layout'),
        ]);

        return NextResponse.json({ success: true, data: body });
    } catch (_error) {
        console.error('Failed to update labels:', _error);
        return NextResponse.json(
            { error: 'Failed to update labels' },
            { status: 500 }
        );
    }
}
