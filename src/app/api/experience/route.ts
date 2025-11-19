import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { ExperienceData } from '@/types/experience';
import { checkAdminAuth } from '@/lib/auth';

const DATA_FILE = path.join(process.cwd(), 'src/data/experience.json');
const BACKUP_FILE = path.join(process.cwd(), 'src/data/experience.backup.json');

async function readExperienceData(): Promise<ExperienceData> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If file doesn't exist, return initial structure
      return { 
        statistics: { years: '+12', projects: '+46', designTools: '+5', clientSatisfaction: '95%' },
        workExperience: [],
        lastUpdated: new Date().toISOString() 
      };
    }
    console.error('Error reading experience data:', error);
    throw error;
  }
}

async function writeExperienceData(data: ExperienceData): Promise<void> {
  // Create a backup before writing
  try {
    await fs.copyFile(DATA_FILE, BACKUP_FILE);
  } catch (error) {
    console.warn('Could not create experience data backup:', error);
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  try {
    const data = await readExperienceData();
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
    
    const data = await readExperienceData();
    
    if (statistics) {
      data.statistics = { ...data.statistics, ...statistics };
    }
    
    if (workExperience) {
      data.workExperience = workExperience;
    }
    
    data.lastUpdated = new Date().toISOString();
    await writeExperienceData(data);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'Error updating experience data', error }, { status: 500 });
  }
}
