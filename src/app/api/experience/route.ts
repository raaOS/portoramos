import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { validateAdminRequest } from '@/lib/auth';
import { experienceService } from '@/lib/services/experienceService';

export async function GET() {
  try {
    const data = await experienceService.getExperienceData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading experience data:', error);
    return NextResponse.json({ error: 'Failed to read experience data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await validateAdminRequest(request))) {
      return NextResponse.json(
        { message: 'Unauthorized or invalid CSRF token' },
        { status: 401 }
      );
    }

    const { statistics, workExperience } = await request.json();

    // Using Partial logic in service
    const data = await experienceService.updateExperienceData({
      statistics,
      workExperience
    });

    revalidatePath('/', 'layout');
    revalidatePath('/about');
    revalidatePath('/cv');

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating experience data:', error);
    return NextResponse.json({ error: 'Failed to update experience data' }, { status: 500 });
  }
}
