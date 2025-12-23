import { ContentService } from './contentService';
import { Testimonial, TestimonialData } from '@/types/testimonial';
import testimonialDataFallback from '@/data/testimonial.json';

// Ensure consistent fallback structure
const defaultData: TestimonialData = {
    testimonials: (testimonialDataFallback as any).testimonials || [],
    lastUpdated: (testimonialDataFallback as any).lastUpdated || new Date().toISOString(),
};

const service = new ContentService<TestimonialData>('testimonial.json', defaultData);

export const testimonialService = {
    async getTestimonials(): Promise<TestimonialData> {
        return await service.getData();
    },

    async createTestimonial(data: Omit<Testimonial, 'id'>): Promise<Testimonial> {
        const currentData = await this.getTestimonials();

        // Generate new ID (max + 1)
        const newId = currentData.testimonials.length > 0
            ? Math.max(...currentData.testimonials.map(t => t.id)) + 1
            : 1;

        const newTestimonial: Testimonial = {
            ...data,
            id: newId,
            isActive: data.isActive !== undefined ? data.isActive : true
        };

        currentData.testimonials.push(newTestimonial);
        currentData.lastUpdated = new Date().toISOString();

        await service.saveData(currentData, `Add testimonial: ${newTestimonial.name}`);
        return newTestimonial;
    },

    async updateTestimonial(id: number, updates: Partial<Testimonial>): Promise<Testimonial | null> {
        const currentData = await this.getTestimonials();
        const index = currentData.testimonials.findIndex(t => t.id === id);

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

    async deleteTestimonial(id: number): Promise<boolean> {
        const currentData = await this.getTestimonials();
        const initialLen = currentData.testimonials.length;

        currentData.testimonials = currentData.testimonials.filter(t => t.id !== id);

        if (currentData.testimonials.length === initialLen) return false;

        currentData.lastUpdated = new Date().toISOString();
        await service.saveData(currentData, `Delete testimonial ID: ${id}`);
        return true;
    }
};
