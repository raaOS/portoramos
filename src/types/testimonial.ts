export interface Testimonial {
  id: number;
  name: string;
  company: string;
  role: string;
  content: string;
  avatar: string;
  isActive?: boolean;
}

export interface TestimonialData {
  testimonials: Testimonial[];
  lastUpdated: string;
}
