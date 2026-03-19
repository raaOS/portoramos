import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { validateAdminRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        if (!(await validateAdminRequest(request, { checkCsrf: false }))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const snapshot = await db.ref('leads').once('value');
        const leads = snapshot.val() || [];

        // Handle both object and array formats (Admin Panel expects array)
        const leadsArray = Array.isArray(leads)
            ? leads
            : Object.keys(leads).map(key => ({ id: key, ...leads[key] }));

        return NextResponse.json(leadsArray);
    } catch (error) {
        console.error('Error fetching leads:', error instanceof Error ? error.message : error);
        return NextResponse.json({
            error: 'Failed to fetch leads',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
