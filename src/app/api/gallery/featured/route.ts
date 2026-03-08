import { NextResponse, type NextRequest } from 'next/server';
import { galleryFeaturedService } from '@/lib/services/galleryFeaturedService';
import { validateAdminRequest } from '@/lib/auth';

export async function GET() {
    try {
        const data = await galleryFeaturedService.getFeaturedData();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading gallery data:', error);
        return NextResponse.json({ featuredProjectIds: [], lastUpdated: new Date().toISOString() });
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!(await validateAdminRequest(request))) {
            return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
        }
        const body = await request.json();
        const { featuredProjectIds } = body;

        if (!Array.isArray(featuredProjectIds)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const newData = await galleryFeaturedService.updateFeaturedData(featuredProjectIds);

        return NextResponse.json({ success: true, data: newData });
    } catch (error) {
        console.error('Error updating gallery data:', error);
        return NextResponse.json({ error: 'Failed to update gallery data' }, { status: 500 });
    }
}
