import { hardSkillService } from '@/lib/services/hardSkillService';
import type { HardSkillsData } from '@/types/hardSkill';

export async function loadHardSkillsData(): Promise<HardSkillsData | null> {
    try {
        return await hardSkillService.getHardSkills();
    } catch (error) {
        console.error('Error loading hard skills data:', error);
        return null;
    }
}
