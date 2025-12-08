// Media Types
export type MediaItem = {
  kind: 'image' | 'video';
  src: string;
  poster?: string;
  width?: number;
  height?: number;
}

// Project Types
// Project Types - Moved to @/types/projects.ts

// About Content Types
export interface AboutContent {
  bio: {
    title: string;
    content: string;
  };
  services?: {
    title: string;
    items: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
  };
  skills?: Array<{
    name: string;
    level: number;
  }>;
  experience?: Array<{
    year: string;
    role: string;
    company: string;
    description: string;
  }>;
}

// Contact Content Types
export interface ContactContent {
  title: string;
  content: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
}

// Toast Types
export interface ToastState {
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// Form Types - keeping minimal types for comments/likes functionality
