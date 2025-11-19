import fs from 'fs/promises';
import path from 'path';
import type { ExperienceData } from '@/types/experience';

const EXPERIENCE_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'experience.json');

export async function loadExperienceData(): Promise<ExperienceData | null> {
  try {
    const json = await fs.readFile(EXPERIENCE_DATA_FILE, 'utf8');
    return JSON.parse(json) as ExperienceData;
  } catch {
    return null;
  }
}

