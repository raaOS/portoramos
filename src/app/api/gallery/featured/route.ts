import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { GalleryFeaturedData } from '@/types/gallery';

const dataFilePath = path.join(process.cwd(), 'src/data/gallery-featured.json');

export async function GET() {
    try {
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const data: GalleryFeaturedData = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading gallery data:', error);
        // Return empty structure if file doesn't exist
        return NextResponse.json({ featuredProjectIds: [], lastUpdated: '' });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { featuredProjectIds } = body;

        if (!Array.isArray(featuredProjectIds)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const newData: GalleryFeaturedData = {
            featuredProjectIds,
            lastUpdated: new Date().toISOString()
        };

        await fs.writeFile(dataFilePath, JSON.stringify(newData, null, 2), 'utf8');

        return NextResponse.json({ success: true, data: newData });
    } catch (error) {
        console.error('Error updating gallery data:', error);
        return NextResponse.json({ error: 'Failed to update gallery data' }, { status: 500 });
    }
}
