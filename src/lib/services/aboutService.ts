import { ContentService } from './contentService';
import { AboutData, UpdateAboutData } from '@/types/about';
import aboutDataFallback from '@/data/about.json';

const service = new ContentService<AboutData>('about.json', aboutDataFallback as AboutData);

export const aboutService = {
    async getAboutData() {
        return await service.getData();
    },

    async updateAboutData(updates: UpdateAboutData) {
        const current = await this.getAboutData();

        // Explicit merging since updates contains Partials
        const mergedData: AboutData = {
            hero: { ...current.hero, ...(updates.hero || {}) },
            professional: { ...current.professional, ...(updates.professional || {}) },
            softSkills: { ...current.softSkills, ...(updates.softSkills || {}) },
            lastUpdated: new Date().toISOString()
        };

        await service.saveData(mergedData, 'Update about page content');
        return mergedData;
    }
};
