import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { UpdateAboutData } from '@/types/about';
import { validateAdminRequest } from '@/lib/auth';
import { aboutService } from '@/lib/services/aboutService';
import { invalidateAboutCache } from '@/lib/about';


// GET - Read about content
export async function GET(_request: NextRequest) {
  try {
    const data = await aboutService.getAboutData(true);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API/About] Error loading about data:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to load about data' }, { status: 500 });
  }
}

// PUT - Update about content (admin only)
export async function PUT(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized or invalid CSRF token' }, { status: 401 });
    }

    const updates: UpdateAboutData = await request.json();

    // The service handles the merging logic now
    const updatedData = await aboutService.updateAboutData(updates);

    // Invalidate cache agar visitor langsung lihat perubahan
    invalidateAboutCache();
    
    // Revalidate ISR pages
    revalidatePath('/', 'layout');
    revalidatePath('/about');

    return NextResponse.json({
      success: true,
      data: updatedData
    });
  } catch (error: unknown) {
    console.error('[API/About] Update Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Failed to update about data',
      details: errorMessage
    }, { status: 500 });
  }
}
