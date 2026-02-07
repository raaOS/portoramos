import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { checkAdminAuth } from '@/lib/auth';

export async function GET(request: any) {
    if (!checkAdminAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const leadsFile = path.join(process.cwd(), 'src/data/leads.json');
        const fileContent = await fs.readFile(leadsFile, 'utf-8');
        const data = JSON.parse(fileContent);
        return NextResponse.json(data.leads || []);
    } catch (error) {
        console.error('Error fetching leads:', error instanceof Error ? error.message : error);
        return NextResponse.json({ 
            error: 'Failed to fetch leads',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
