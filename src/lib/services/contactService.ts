import { ContentService } from './contentService';
import { ContactData, UpdateContactData } from '@/types/contact';
import contactFallback from '@/data/contact.json';

const service = new ContentService<ContactData>('contact.json', contactFallback as unknown as ContactData);

export const contactService = {
    async getContactData() {
        return await service.getData();
    },

    async updateContactData(updates: UpdateContactData) {
        const current = await this.getContactData();

        // Merge logic
        const mergedData: ContactData = {
            ...current,
            content: { ...current.content, ...(updates.content || {}) } as any,
            info: { ...current.info, ...(updates.info || {}) },
            formSettings: { ...current.formSettings, ...(updates.formSettings || {}) },
            lastUpdated: new Date().toISOString()
        };

        await service.saveData(mergedData, 'Update contact content');
        return mergedData;
    }
};
