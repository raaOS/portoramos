import { aboutService } from '@/lib/services/aboutService';
import type { AboutData } from '@/types/about';

export async function loadAboutData(): Promise<AboutData | null> {
  try {
    return await aboutService.getAboutData();
  } catch (error) {
    console.error('Error loading about data:', error);
    return null;
  }
}

