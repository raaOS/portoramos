import { ContentService } from './contentService';
import { Testimonial, TestimonialData } from '@/types/testimonial';
import testimonialDataFallback from '@/data/testimonial.json';
import { bucket } from '@/lib/firebaseAdmin';

// Counter untuk menghindari collision pada timestamp yang sama
let idCounter = 0;

// Ensure consistent fallback structure
interface TestimonialJsonData {
    testimonials?: unknown[];
    lastUpdated?: string;
}

const defaultData: TestimonialData = {
    testimonials: ((testimonialDataFallback as TestimonialJsonData).testimonials as Testimonial[]) || [],
    lastUpdated: (testimonialDataFallback as TestimonialJsonData).lastUpdated || new Date().toISOString(),
};

const service = new ContentService<TestimonialData>('testimonial.json', defaultData);

export const testimonialService = {
    async getTestimonials(): Promise<TestimonialData> {
        return await service.getData();
    },

    async createTestimonial(data: Omit<Testimonial, 'id'>): Promise<Testimonial> {
        const currentData = await this.getTestimonials();

        // CRITICAL FIX: Generate unique ID dengan kombinasi timestamp + counter + random
        // Menghindari race condition saat concurrent creates
        idCounter = (idCounter + 1) % 10000;
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        const newId = timestamp * 10000 + idCounter * 1000 + random;

        // Ensure ID is truly unique by checking existing IDs
        const existingIds = new Set(currentData.testimonials.map(t => t.id));
        let finalId = newId;
        while (existingIds.has(finalId)) {
            finalId++;
        }

        const newTestimonial: Testimonial = {
            ...data,
            id: finalId,
            isActive: data.isActive !== undefined ? data.isActive : true
        };

        currentData.testimonials.push(newTestimonial);
        currentData.lastUpdated = new Date().toISOString();

        await service.saveData(currentData, `Add testimonial: ${newTestimonial.name}`);
        return newTestimonial;
    },

    async updateTestimonial(id: number | string, updates: Partial<Testimonial>): Promise<Testimonial | null> {
        const currentData = await this.getTestimonials();
        // Coerce to number to handle string IDs from JSON.parse
        const numId = Number(id);
        const index = currentData.testimonials.findIndex(t => t.id === numId);

        if (index === -1) return null;

        const updatedTestimonial = {
            ...currentData.testimonials[index],
            ...updates
        };

        currentData.testimonials[index] = updatedTestimonial;
        currentData.lastUpdated = new Date().toISOString();

        await service.saveData(currentData, `Update testimonial: ${updatedTestimonial.name}`);
        return updatedTestimonial;
    },

    async deleteTestimonial(id: number | string): Promise<boolean> {
        const currentData = await this.getTestimonials();
        // Coerce to number to handle string IDs from JSON.parse
        const numId = Number(id);
        const testimonial = currentData.testimonials.find(t => t.id === numId);

        if (!testimonial) return false;

        // Cleanup Storage Assets inside Testimonial Chat
        try {
            const assetUrls: string[] = [];
            testimonial.messages?.forEach(msg => {
                if (msg.imageSrc) assetUrls.push(msg.imageSrc);
            });

            for (const url of assetUrls) {
                try {
                    let storagePath = '';
                    if (url.includes('/o/')) {
                        storagePath = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
                    } else if (url.startsWith('/assets/')) {
                        storagePath = url.substring(1);
                    }

                    if (storagePath && storagePath.startsWith('assets/')) {
                        const file = bucket.file(storagePath);
                        const [exists] = await file.exists();
                        if (exists) await file.delete();
                    }
                } catch (e) {
                    console.warn(`[TestimonialService] Ghost cleanup failed for: ${url}`, e);
                }
            }
        } catch (e) {
            console.error('[TestimonialService] Storage audit failed during delete:', e);
        }

        currentData.testimonials = currentData.testimonials.filter(t => t.id !== numId);
        currentData.lastUpdated = new Date().toISOString();
        await service.saveData(currentData, `Delete testimonial ID: ${id}`);
        return true;
    }
};
