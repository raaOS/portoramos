import { NextRequest, NextResponse } from 'next/server';
import { UpdateAboutData } from '@/types/about';
import { checkAdminAuth } from '@/lib/auth';
import { aboutService } from '@/lib/services/aboutService';

// GET - Read about content
export async function GET(request: NextRequest) {
  try {
    const data = await aboutService.getAboutData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading about data:', error);
    return NextResponse.json({ error: 'Failed to load about data' }, { status: 500 });
  }
}

// PUT - Update about content (admin only)
export async function PUT(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateAboutData = await request.json();

    // The service handles the merging logic now
    const updatedData = await aboutService.updateAboutData(body);

    return NextResponse.json({
      success: true,
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating about data:', error);
    return NextResponse.json({ error: 'Failed to update about data' }, { status: 500 });
  }
}
