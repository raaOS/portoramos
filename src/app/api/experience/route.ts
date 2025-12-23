import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { experienceService } from '@/lib/services/experienceService';

export async function GET() {
  try {
    const data = await experienceService.getExperienceData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'Error reading experience data', error }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!checkAdminAuth(request)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { statistics, workExperience } = await request.json();

    // Using Partial logic in service
    const data = await experienceService.updateExperienceData({
      statistics,
      workExperience
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating experience data', error }, { status: 500 });
  }
}
