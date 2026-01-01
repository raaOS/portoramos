import fs from 'fs';
import path from 'path';
import { AIHunterData, AIJob, AIHunterSettings } from '@/types/ai-hunter';

const DATA_FILE = path.join(process.cwd(), 'src/data/ai-hunter-jobs.json');

export const aiHunterService = {
    async getData(): Promise<AIHunterData> {
        try {
            if (!fs.existsSync(DATA_FILE)) {
                return { jobs: [], settings: this.getDefaultSettings() };
            }
            const fileData = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(fileData);
        } catch (error) {
            console.error('[AIHunterService] Error reading data:', error);
            return { jobs: [], settings: this.getDefaultSettings() };
        }
    },

    async saveData(data: AIHunterData): Promise<void> {
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('[AIHunterService] Error saving data:', error);
        }
    },

    getDefaultSettings(): AIHunterSettings {
        return {
            isHunting: false,
            targetPlatforms: ['LinkedIn', 'Upwork', 'Dribbble'],
            minBudget: 2500,
            currency: 'USD',
            roles: ['UI Designer', 'Art Director'],
            location: 'Remote',
            employmentTypes: ['Freelance', 'Remote', 'Full-time'],
            payFrequency: 'monthly',
            voiceTone: 'professional',
            lastHuntTimestamp: null
        };
    },

    async updateSettings(settings: Partial<AIHunterSettings>): Promise<AIHunterSettings> {
        const data = await this.getData();
        data.settings = { ...data.settings, ...settings };
        await this.saveData(data);
        return data.settings;
    },

    async addJob(job: Omit<AIJob, 'id' | 'timestamp' | 'status'>): Promise<AIJob> {
        const data = await this.getData();
        const newJob: AIJob = {
            ...job,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        data.jobs.unshift(newJob);
        // Keep only last 50 jobs for performance
        if (data.jobs.length > 50) data.jobs = data.jobs.slice(0, 50);
        await this.saveData(data);
        return newJob;
    },

    async updateJob(id: string, updates: Partial<AIJob>): Promise<AIJob | null> {
        const data = await this.getData();
        const index = data.jobs.findIndex(j => j.id === id);
        if (index === -1) return null;

        data.jobs[index] = { ...data.jobs[index], ...updates };
        await this.saveData(data);
        return data.jobs[index];
    }
};
