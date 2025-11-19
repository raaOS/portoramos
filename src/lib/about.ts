import { loadData } from '@/lib/backup';
import type { AboutData } from '@/types/about';
import path from 'path';

const ABOUT_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'about.json');

export async function loadAboutData(): Promise<AboutData | null> {
  try {
    const data = (await loadData(ABOUT_DATA_FILE)) as AboutData | null;
    return data ?? null;
  } catch {
    return null;
  }
}

