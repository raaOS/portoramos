import { HardSkill, HardSkillsData, HardSkillLevel } from '@/types/hardSkill';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import hardSkillsDataFallback from '@/data/hardSkills.json';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'hardSkills.json');
const GITHUB_PATH = 'src/data/hardSkills.json';

// Helper for normalization
function normaliseLevel(level?: string): HardSkillLevel {
    if (level === 'Beginner' || level === 'Intermediate' || level === 'Advanced' || level === 'Expert') {
        return level;
    }
    return 'Intermediate';
}

export const hardSkillService = {
    async getHardSkills(): Promise<HardSkillsData> {
        try {
            let data: HardSkillsData | null = null;
            const isDev = process.env.NODE_ENV === 'development';

            if (isDev) {
                await ensureDataDir();
                data = (await loadData(DATA_FILE)) as HardSkillsData | null;
            } else {
                try {
                    const ghData = await githubService.getFileContent<HardSkillsData>(GITHUB_PATH, true);
                    if (ghData && ghData.content) {
                        data = ghData.content;
                    }
                } catch (error) {
                    console.warn('Failed to fetch hard skills from GitHub, falling back:', error);
                }
            }

            if (!data) {
                data = hardSkillsDataFallback as unknown as HardSkillsData;
            }

            // Ensure structure
            if (!data || !data.skills) {
                return { skills: [], lastUpdated: new Date().toISOString() };
            }

            return data;
        } catch (error) {
            console.error('Error loading hard skills:', error);
            return { skills: [], lastUpdated: new Date().toISOString() };
        }
    },

    async createHardSkill(skillData: Omit<HardSkill, 'id' | 'createdAt' | 'updatedAt'>): Promise<HardSkill> {
        const currentData = await this.getHardSkills();
        const currentSkills = currentData.skills || [];

        const newSkill: HardSkill = {
            id: `hard-${Date.now()}`,
            ...skillData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const updatedSkills = [...currentSkills, newSkill];
        await this.save(updatedSkills, `Add hard skill: ${newSkill.name}`);

        return newSkill;
    },

    async updateHardSkill(id: string, updates: Partial<HardSkill>): Promise<HardSkill | null> {
        const currentData = await this.getHardSkills();
        const currentSkills = currentData.skills || [];

        const index = currentSkills.findIndex(s => s.id === id);
        if (index === -1) return null;

        const updatedSkill = {
            ...currentSkills[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        currentSkills[index] = updatedSkill;
        await this.save(currentSkills, `Update hard skill: ${updatedSkill.name}`);

        return updatedSkill;
    },

    async deleteHardSkill(id: string): Promise<boolean> {
        const currentData = await this.getHardSkills();
        const currentSkills = currentData.skills || [];

        const filtered = currentSkills.filter(s => s.id !== id);
        if (filtered.length === currentSkills.length) return false;

        await this.save(filtered, `Delete hard skill ID: ${id}`);
        return true;
    },

    async save(skills: HardSkill[], message: string): Promise<boolean> {
        const isDev = process.env.NODE_ENV === 'development';
        const data: HardSkillsData = {
            skills,
            lastUpdated: new Date().toISOString()
        };

        if (isDev) {
            return await saveData(DATA_FILE, data);
        } else {
            return await githubService.updateFile(GITHUB_PATH, data, message + ' (via Admin CMS)');
        }
    }
};
