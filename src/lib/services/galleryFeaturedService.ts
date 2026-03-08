import { ContentService } from './contentService';
import { GalleryFeaturedData } from '@/types/gallery';
import galleryFeaturedFallback from '@/data/gallery-featured.json';

const defaultData: GalleryFeaturedData = {
    featuredProjectIds: (galleryFeaturedFallback as GalleryFeaturedData).featuredProjectIds || [],
    lastUpdated: (galleryFeaturedFallback as GalleryFeaturedData).lastUpdated || new Date().toISOString()
};

const service = new ContentService<GalleryFeaturedData>('gallery-featured.json', defaultData);

export const galleryFeaturedService = {
    async getFeaturedData(): Promise<GalleryFeaturedData> {
        return await service.getData();
    },

    async updateFeaturedData(featuredProjectIds: string[]): Promise<GalleryFeaturedData> {
        const newData: GalleryFeaturedData = {
            featuredProjectIds,
            lastUpdated: new Date().toISOString()
        };

        const success = await service.saveData(newData);
        if (!success) {
            throw new Error('Failed to save featured gallery data');
        }

        return newData;
    }
};
