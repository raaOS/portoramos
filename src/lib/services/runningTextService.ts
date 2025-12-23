import { ContentService } from './contentService';
import { RunningTextData, RunningTextItem } from '@/types/runningText';
import { v4 as uuidv4 } from 'uuid';

const FALLBACK_RUNNING_TEXT: RunningTextData = {
    items: [
        { id: '1', text: 'AVAILABLE FOR FREELANCE PROJECT', order: 1, isActive: true },
        { id: '2', text: 'OPEN FOR COLLABORATION', order: 2, isActive: true },
        { id: '3', text: 'CREATIVE DESIGNER', order: 3, isActive: true },
    ],
    lastUpdated: new Date().toISOString(),
};

// Moving to src/data/running-text.json for consistency
const service = new ContentService<RunningTextData>('running-text.json', FALLBACK_RUNNING_TEXT);

export const runningTextService = {
    async getRunningTextData() {
        return await service.getData();
    },

    async createItem(text: string, order?: number, isActive: boolean = true) {
        const data = await this.getRunningTextData();
        const newItem: RunningTextItem = {
            id: uuidv4(),
            text,
            order: order || data.items.length + 1,
            isActive,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        data.items.push(newItem);
        data.lastUpdated = new Date().toISOString();

        await service.saveData(data, `Add running text: ${text}`);
        return newItem;
    },

    async updateItems(items: RunningTextItem[]) {
        const data = await this.getRunningTextData();
        // This is typically a bulk update (reorder)
        data.items = items;
        data.lastUpdated = new Date().toISOString();

        await service.saveData(data, 'Update running text items (reorder/bulk)');
        return data.items;
    },

    async updateItem(id: string, updates: Partial<RunningTextItem>) {
        const data = await this.getRunningTextData();
        const index = data.items.findIndex(i => i.id === id);
        if (index === -1) return null;

        data.items[index] = { ...data.items[index], ...updates, updatedAt: new Date().toISOString() };
        data.lastUpdated = new Date().toISOString();

        await service.saveData(data, `Update running text item: ${data.items[index].text}`);
        return data.items[index];
    },

    async deleteItem(id: string) {
        const data = await this.getRunningTextData();
        const initialLen = data.items.length;
        data.items = data.items.filter(i => i.id !== id);

        if (data.items.length === initialLen) return false;

        data.lastUpdated = new Date().toISOString();
        await service.saveData(data, `Delete running text item ID: ${id}`);
        return true;
    }
    // The original API might rely on PUT for everything. I should check if there's specific item update logic.
    // The API I saw earlier had:
    // PUT for bulk update of items array.
    // There was no specific single item update/delete exposed in the main route file I read?
    // Actually, I should check if there's a dynamic route [id] for running text. 
    // List dir showed running-text has 2 children. Maybe [id]?
};
