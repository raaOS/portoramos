import type { TestimonialData } from '@/types/testimonial';
import { testimonialService } from '@/lib/services/testimonialService';

export async function loadTestimonialsData(): Promise<TestimonialData | null> {
  try {
    return await testimonialService.getTestimonials();
  } catch (error) {
    console.error('Error loading testimonials:', error);
    return null;
  }
}
