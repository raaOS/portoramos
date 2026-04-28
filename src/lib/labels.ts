import { ContentService } from '@/lib/services/contentService';
import labelsFallback from '@/data/labels.json';
import { Label } from '@/types/labels';

const service = new ContentService<Label[]>('labels.json', labelsFallback as Label[]);

export async function allLabelsAsync(): Promise<Label[]> {
    try {
        return await service.getData();
    } catch (error) {
        console.error('Error fetching labels:', error);
        return labelsFallback as Label[];
    }
}
