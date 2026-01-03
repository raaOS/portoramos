import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
    try {
        const leadsFile = path.join(process.cwd(), 'src/data/leads.json');
        const fileContent = await fs.readFile(leadsFile, 'utf-8');
        const data = JSON.parse(fileContent);
        return NextResponse.json(data.leads || []);
    } catch (error) {
        console.error('Error fetching leads:', error);
        return NextResponse.json([]);
    }
}
