import { NextRequest, NextResponse } from 'next/server';
import { ContentService } from '@/lib/services/contentService';
import { validateAdminRequest } from '@/lib/auth';
import labelsFallback from '@/data/labels.json';
import { Label } from '@/types/labels';

const service = new ContentService<Label[]>('labels.json', labelsFallback as Label[]);

export async function GET() {
    try {
        const data = await service.getData();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // Auth check
    if (!(await validateAdminRequest(req))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    try {
        const labels = await req.json();
        
        if (!Array.isArray(labels)) {
            return NextResponse.json({ error: 'Data must be an array' }, { status: 400 });
        }

        const success = await service.saveData(labels);
        if (success) {
            return NextResponse.json({ success: true, data: labels });
        } else {
            return NextResponse.json({ error: 'Failed to save labels' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
