import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { validateAdminRequest } from '@/lib/auth';

// GET Handler
export async function GET() {
    try {
        const snapshot = await db.ref('content/about').once('value');
        const data = snapshot.val() || {};

        if (!data.designPhilosophy) {
            return NextResponse.json({
                heading: "Design Philosophy",
                subheading: "Strategic Thinking Framework",
                steps: []
            });
        }

        return NextResponse.json(data.designPhilosophy);
    } catch (error) {
        console.error('Failed to fetch Design Philosophy:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST Handler (Update)
export async function POST(request: NextRequest) {
    try {
        if (!await validateAdminRequest(request)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const newData = await request.json();

        // Update in Firebase Realtime Database
        await db.ref('content/about/designPhilosophy').set(newData);
        await db.ref('content/about/lastUpdated').set(new Date().toISOString());

        return NextResponse.json({ success: true, data: newData });
    } catch (error) {
        console.error('Failed to update Design Philosophy:', error);
        return NextResponse.json(
            { error: 'Failed to update data' },
            { status: 500 }
        );
    }
}
