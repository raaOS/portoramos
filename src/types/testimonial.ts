export interface ChatHistoryMessage {
  id: number;
  text: string;
  isMe: boolean;
  time: string;
}

export interface Testimonial {
  id: number;
  name: string;
  notificationText: string;
  isActive?: boolean;
  messages?: ChatHistoryMessage[];
  // Keep legacy for backward compatibility during migration if needed
  company?: string;
  role?: string;
  content?: string;
}

export interface TestimonialData {
  testimonials: Testimonial[];
  lastUpdated: string;
}
