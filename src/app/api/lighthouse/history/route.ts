import { NextRequest, NextResponse } from 'next/server';
import { lighthouseService, LighthouseHistoryItem } from '@/lib/services/lighthouseService';

export async function GET() {
    const history = await lighthouseService.getHistory();
    return NextResponse.json(history);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url, scores } = body;

        if (!url || !scores) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newItem: LighthouseHistoryItem = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            url,
            scores
        };

        const success = await lighthouseService.saveResult(newItem);

        if (success) {
            return NextResponse.json({ success: true, item: newItem });
        } else {
            return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error saving history:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
