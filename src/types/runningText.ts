export interface RunningTextItem {
    id: string;
    text: string;
    order: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface RunningTextData {
    items: RunningTextItem[];
    lastUpdated?: string;
}
