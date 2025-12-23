import { ContentService } from './contentService';

export interface LighthouseHistoryItem {
    id: string; // timestamp
    date: string;
    url: string;
    scores: {
        performance: number;
        accessibility: number;
        bestPractices: number;
        seo: number;
    };
}

export interface LighthouseHistoryData {
    history: LighthouseHistoryItem[];
}

// Instantiate the content service for history
// Using 'lighthouse-history.json' as the file name
const historyService = new ContentService<LighthouseHistoryData>('lighthouse-history.json', { history: [] });

export const lighthouseService = {
    getHistory: async (): Promise<LighthouseHistoryItem[]> => {
        try {
            const data = await historyService.getData();
            return data.history || [];
        } catch (error) {
            console.warn('Failed to fetch lighthouse history:', error);
            return [];
        }
    },

    saveResult: async (item: LighthouseHistoryItem): Promise<boolean> => {
        try {
            const currentData = await historyService.getData();

            // Keep only last 50 records to prevent file bloat
            const newHistory = [item, ...currentData.history].slice(0, 50);

            return await historyService.saveData(
                { history: newHistory },
                `Update lighthouse history: Audit for ${item.url}`
            );
        } catch (error) {
            console.error('Failed to save lighthouse history:', error);
            return false;
        }
    }
};
