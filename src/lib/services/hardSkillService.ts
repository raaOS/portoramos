import { HardSkill, HardSkillsData } from '@/types/hardSkill';
import { ContentService } from '@/lib/services/contentService';
import hardSkillsDataFallback from '@/data/hardSkills.json';

const service = new ContentService<HardSkillsData>('hardSkills.json', hardSkillsDataFallback as unknown as HardSkillsData);

async function getHardSkills(noCache = false): Promise<HardSkillsData> {
    const data = await service.getData(noCache);
    
    // Ensure structure
    if (!data || !data.skills) {
        return { skills: [], lastUpdated: new Date().toISOString() };
    }

    return data;
}

async function saveHardSkills(skills: HardSkill[], message: string): Promise<boolean> {
    const data: HardSkillsData = {
        skills,
        lastUpdated: new Date().toISOString()
    };
    return await service.saveData(data, message);
}

async function createHardSkill(skillData: Omit<HardSkill, 'id' | 'createdAt' | 'updatedAt'>): Promise<HardSkill> {
    const currentData = await getHardSkills();
    const currentSkills = currentData.skills || [];

    const newSkill: HardSkill = {
        id: `hard-${Date.now()}`,
        ...skillData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const updatedSkills = [...currentSkills, newSkill];
    await saveHardSkills(updatedSkills, `Add hard skill: ${newSkill.name}`);

    return newSkill;
}

async function updateHardSkill(id: string, updates: Partial<HardSkill>): Promise<HardSkill | null> {
    const currentData = await getHardSkills();
    const currentSkills = currentData.skills || [];

    const index = currentSkills.findIndex(s => s.id === id);
    if (index === -1) return null;

    const updatedSkill = {
        ...currentSkills[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    currentSkills[index] = updatedSkill;
    await saveHardSkills(currentSkills, `Update hard skill: ${updatedSkill.name}`);

    return updatedSkill;
}

async function deleteHardSkill(id: string): Promise<boolean> {
    const currentData = await getHardSkills();
    const currentSkills = currentData.skills || [];

    const filtered = currentSkills.filter(s => s.id !== id);
    if (filtered.length === currentSkills.length) return false;

    await saveHardSkills(filtered, `Delete hard skill ID: ${id}`);
    return true;
}

export const hardSkillService = {
    getHardSkills,
    saveHardSkills,
    createHardSkill,
    updateHardSkill,
    deleteHardSkill
};
