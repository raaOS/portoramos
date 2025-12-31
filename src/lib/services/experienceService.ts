import { ContentService } from './contentService';
import { ExperienceData } from '@/types/experience';
// No specific fallback file usually for experience, or it's experience.json itself.
// The route previously hardcoded a fallback. Let's create a constant.

const FALLBACK_EXPERIENCE: ExperienceData = {
    statistics: { years: '+12', projects: '+46', designTools: '+5', clientSatisfaction: '95%' },
    workExperience: [],
    lastUpdated: new Date().toISOString()
};

import experienceFixed from '@/data/experience.json';

const service = new ContentService<ExperienceData>('experience.json', experienceFixed as unknown as ExperienceData);

export const experienceService = {
    async getExperienceData() {
        // In production, fallback to the bundled JSON (which contains the 404 fix)
        // instead of fetching potentially stale data from GitHub.
        // Admin updates will trigger a rebuild, updating this bundled file.
        if (process.env.NODE_ENV === 'production') {
            return experienceFixed as unknown as ExperienceData;
        }
        return await service.getData();
    },

    async updateExperienceData(updates: Partial<ExperienceData>) {
        const current = await this.getExperienceData();

        // Merge logic
        const mergedData: ExperienceData = {
            ...current,
            statistics: { ...current.statistics, ...(updates.statistics || {}) },
            workExperience: updates.workExperience || current.workExperience,
            lastUpdated: new Date().toISOString()
        };

        await service.saveData(mergedData, 'Update experience content');
        return mergedData;
    }
};
