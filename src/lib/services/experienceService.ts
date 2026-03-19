import { ContentService } from './contentService';
import { ExperienceData } from '@/types/experience';

import experienceFixed from '@/data/experience.json';

const service = new ContentService<ExperienceData>('experience.json', experienceFixed as unknown as ExperienceData);

export const experienceService = {
    /**
     * Retrieves the current "Experience" data (stats and work history).
     * 
     * @returns A promise that resolves to the ExperienceData.
     */
    async getExperienceData() {
        return await service.getData();
    },

    /**
     * Updates the "Experience" data.
     * Merges statistics and replaces/updates work experience list.
     * 
     * @param updates - The partial experience data to update.
     * @returns A promise that resolves to the updated experience data.
     */
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
