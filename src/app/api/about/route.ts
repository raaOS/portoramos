import { NextRequest, NextResponse } from 'next/server';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { AboutData, UpdateAboutData } from '@/types/about';
import { checkAdminAuth } from '@/lib/auth';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'about.json');

// GET - Read about content
export async function GET(request: NextRequest) {
  try {
    await ensureDataDir();
    const data = await loadData(DATA_FILE) as AboutData;
    
    if (!data) {
      return NextResponse.json({ error: 'Failed to load about data' }, { status: 500 });
    }

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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: UpdateAboutData = await request.json();
    
    await ensureDataDir();
    const data = await loadData(DATA_FILE) as AboutData;
    
    if (!data) {
      return NextResponse.json({ error: 'Failed to load about data' }, { status: 500 });
    }

    // Update data with new content
    const updatedData: AboutData = {
      hero: { ...data.hero, ...body.hero },
      professional: { ...data.professional, ...body.professional },
      softSkills: { ...data.softSkills, ...body.softSkills },
      lastUpdated: new Date().toISOString()
    };

    // Save data
    const success = await saveData(DATA_FILE, updatedData);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to save about data' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedData 
    });
  } catch (error) {
    console.error('Error updating about data:', error);
    return NextResponse.json({ error: 'Failed to update about data' }, { status: 500 });
  }
}
