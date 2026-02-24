import { ContentService } from './contentService';
import { AboutData, UpdateAboutData } from '@/types/about';
import aboutDataFallback from '@/data/about.json';

const service = new ContentService<AboutData>('about.json', aboutDataFallback as unknown as AboutData);

export const aboutService = {
    /**
     * Retrieves the current "About" page data.
     * Uses ContentService for persistence and fallback logic.
     * 
     * @returns A promise that resolves to the AboutData.
     */
    async getAboutData(noCache = false) {
        return await service.getData(noCache);
    },

    /**
     * Updates the "About" page data with partial updates.
     * Performs an explicit deep merge for nested configuration objects.
     * 
     * @param updates - The partial data to update.
     * @returns A promise that resolves to the updated merged data.
     */
    async updateAboutData(updates: UpdateAboutData) {
        try {
            const current = await this.getAboutData();
            console.log('[AboutService] Updating data with:', JSON.stringify(updates).slice(0, 100) + '...');

            // Explicit merging since updates contains Partials
            const mergedData: AboutData = {
                ...current, // Preserve all base fields (notifications, etc)
                hero: { ...current.hero, ...(updates.hero || {}) },
                professional: { ...current.professional, ...(updates.professional || {}) },
                softSkills: { ...current.softSkills, ...(updates.softSkills || {}) },
                designPhilosophy: { ...(current.designPhilosophy || {}), ...(updates.designPhilosophy || {}) } as any,

                // OS Configuration
                desktopPreferences: { ...current.desktopPreferences, ...(updates.desktopPreferences || {}) } as any,
                wallpaperConfig: { ...current.wallpaperConfig, ...(updates.wallpaperConfig || {}) } as any,
                dockConfig: { ...current.dockConfig, ...(updates.dockConfig || {}) } as any,
                chatSettings: { ...current.chatSettings, ...(updates.chatSettings || {}) } as any,
                windowPreferences: { ...current.windowPreferences, ...(updates.windowPreferences || {}) } as any,
                soundConfig: { ...current.soundConfig, ...(updates.soundConfig || {}) } as any,
                labels: { ...(current.labels || {}), ...(updates.labels || {}) } as any,

                lastUpdated: new Date().toISOString()
            };

            const success = await service.saveData(mergedData, 'Update about page content');
            if (!success) {
                throw new Error('ContentService failed to save data');
            }

            console.log('[AboutService] Successfully updated about content');
            return mergedData;
        } catch (error) {
            console.error('[AboutService] Update failed:', error);
            throw error;
        }
    }
};
