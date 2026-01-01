export type JobStatus = 'pending' | 'sending' | 'success' | 'failed';

export interface AIJob {
    id: string;
    company: string;
    role: string;
    source: string;
    description: string;
    matchScore: number;
    status: JobStatus;
    timestamp: string;
    proposalDraft?: string;
    reason?: string;
    applyUrl?: string;
}

export interface AIHunterSettings {
    isHunting: boolean;
    targetPlatforms: string[];
    minBudget: number;
    voiceTone: string;
    lastHuntTimestamp: string | null;
}

export interface AIHunterData {
    jobs: AIJob[];
    settings: AIHunterSettings;
}
