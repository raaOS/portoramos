import { ContentService } from './contentService';
import { Testimonial, TestimonialData } from '@/types/testimonial';
import testimonialDataFallback from '@/data/testimonial.json';
import { deleteStorageAssets } from '@/lib/services/storageCleanup';

// Counter untuk menghindari collision pada timestamp yang sama
let idCounter = 0;

// Ensure consistent fallback structure
interface TestimonialJsonData {
  testimonials?: unknown[];
  lastUpdated?: string;
}

const defaultData: TestimonialData = {
  testimonials:
    ((testimonialDataFallback as TestimonialJsonData).testimonials as Testimonial[]) || [],
  lastUpdated:
    (testimonialDataFallback as TestimonialJsonData).lastUpdated || new Date().toISOString(),
};

const service = new ContentService<TestimonialData>('testimonial.json', defaultData);

const normalizeTestimonialId = (id: Testimonial['id'] | number): string => String(id).trim();

const normalizeTestimonial = (testimonial: Testimonial): Testimonial => ({
  ...testimonial,
  id: normalizeTestimonialId(testimonial.id),
});

const normalizeTestimonialData = (data: TestimonialData): TestimonialData => ({
  ...data,
  testimonials: data.testimonials.map(normalizeTestimonial),
});

const generateTestimonialId = (): string => {
  idCounter = (idCounter + 1) % 10000;
  return `testimonial-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
};

export const testimonialService = {
  async getTestimonials(): Promise<TestimonialData> {
    const data = await service.getData();
    return normalizeTestimonialData(data);
  },

  async createTestimonial(data: Omit<Testimonial, 'id'>): Promise<Testimonial> {
    const currentData = await this.getTestimonials();
    const existingIds = new Set(currentData.testimonials.map((t) => t.id));
    let finalId = generateTestimonialId();
    while (existingIds.has(finalId)) {
      finalId = generateTestimonialId();
    }

    const newTestimonial: Testimonial = {
      ...data,
      id: finalId,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };

    currentData.testimonials.push(newTestimonial);
    currentData.lastUpdated = new Date().toISOString();

    await service.saveData(currentData, `Add testimonial: ${newTestimonial.name}`);
    return newTestimonial;
  },

  async updateTestimonial(
    id: number | string,
    updates: Partial<Testimonial>
  ): Promise<Testimonial | null> {
    const currentData = await this.getTestimonials();
    const normalizedId = normalizeTestimonialId(id);
    const index = currentData.testimonials.findIndex((t) => t.id === normalizedId);

    if (index === -1) return null;

    const updatedTestimonial = {
      ...currentData.testimonials[index],
      ...updates,
    };

    currentData.testimonials[index] = updatedTestimonial;
    currentData.lastUpdated = new Date().toISOString();

    await service.saveData(currentData, `Update testimonial: ${updatedTestimonial.name}`);
    return updatedTestimonial;
  },

  async deleteTestimonial(id: number | string): Promise<boolean> {
    const currentData = await this.getTestimonials();
    const normalizedId = normalizeTestimonialId(id);
    const testimonial = currentData.testimonials.find((t) => t.id === normalizedId);

    if (!testimonial) return false;

    // Cleanup Storage Assets inside Testimonial Chat
    const assetUrls: string[] = [];
    testimonial.messages?.forEach((msg) => {
      if (msg.imageSrc) assetUrls.push(msg.imageSrc);
    });
    await deleteStorageAssets(assetUrls, 'TestimonialService');

    currentData.testimonials = currentData.testimonials.filter((t) => t.id !== normalizedId);
    currentData.lastUpdated = new Date().toISOString();
    await service.saveData(currentData, `Delete testimonial ID: ${id}`);
    return true;
  },
};
