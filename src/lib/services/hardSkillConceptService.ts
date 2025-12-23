import { ContentService } from './contentService';
import { HardSkillConcept, HardSkillConceptsData } from '@/types/hardSkillConcept';
import { FALLBACK_HARD_SKILL_CONCEPTS } from '@/data/fallback-content';

const defaultData: HardSkillConceptsData = {
    concepts: FALLBACK_HARD_SKILL_CONCEPTS,
    lastUpdated: new Date().toISOString(),
};

const service = new ContentService<HardSkillConceptsData>('hardSkillConcepts.json', defaultData);

export const hardSkillConceptService = {
    async getConcepts() {
        return await service.getData();
    },

    async createConcept(conceptData: Omit<HardSkillConcept, 'id' | 'createdAt' | 'updatedAt'>) {
        const data = await this.getConcepts();
        const newConcept: HardSkillConcept = {
            id: `concept-${Date.now()}`,
            ...conceptData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        data.concepts.push(newConcept);
        data.lastUpdated = new Date().toISOString();

        await service.saveData(data, `Add concept: ${newConcept.title}`);
        return newConcept;
    },

    async updateConcept(id: string, updates: Partial<HardSkillConcept>) {
        const data = await this.getConcepts();
        const index = data.concepts.findIndex(c => c.id === id);
        if (index === -1) return null;

        data.concepts[index] = { ...data.concepts[index], ...updates, updatedAt: new Date().toISOString() };
        data.lastUpdated = new Date().toISOString();

        await service.saveData(data, `Update concept: ${data.concepts[index].title}`);
        return data.concepts[index];
    },

    async deleteConcept(id: string) {
        const data = await this.getConcepts();
        const initialLen = data.concepts.length;
        data.concepts = data.concepts.filter(c => c.id !== id);

        if (data.concepts.length === initialLen) return false;

        data.lastUpdated = new Date().toISOString();
        await service.saveData(data, `Delete concept ID: ${id}`);
        return true;
    }
};
