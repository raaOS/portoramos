import { hardSkillService } from '@/lib/services/hardSkillService';
import type { HardSkillsData } from '@/types/hardSkill';

export async function loadHardSkillsData(noCache = false): Promise<HardSkillsData | null> {
  try {
    return await hardSkillService.getHardSkills(noCache);
  } catch (error) {
    console.error('Error loading hard skills data:', error);
    return null;
  }
}
