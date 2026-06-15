/** Type definitions untuk data testimonial dan chat history. @module */
export interface ChatHistoryMessage {
  id: number;
  text: string;
  isMe: boolean;
  time: string;
  type?: 'text' | 'image' | 'project';
  imageSrc?: string;
  projectId?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  notificationText: string;
  isActive?: boolean;
  messages?: ChatHistoryMessage[];
  projectId?: string; // Linked project ID
  // Keep legacy for backward compatibility during migration if needed
  company?: string;
  role?: string;
  content?: string;
}

export interface TestimonialData {
  testimonials: Testimonial[];
  lastUpdated: string;
}
