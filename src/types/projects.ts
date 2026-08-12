/** Type definitions untuk data project portofolio. @module */
import { Comment } from '@/lib/magic';

export interface Project {
  id: string;
  title: string;
  slug: string;
  client: string;
  year: number;
  tags: string[];
  cover: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  playsInline: boolean;
  coverWidth: number;
  coverHeight: number;
  description: string;
  description_id?: string;
  title_id?: string;
  likes?: number;
  shares?: number;
  allowComments?: boolean;
  pdfUrl?: string;

  // New Case Study Fields
  role?: string;
  timeline?: string;
  team?: string;
  software?: string[];
  type?: 'commercial' | 'visual_art';

  narrative?: {
    // Commercial
    context?: string;
    challenge?: string;
    solution?: string;
    impact?: string; // Replaces 'result' for commercial
    result?: string; // Legacy support

    // Visual Art
    concept?: string;
    process?: string;
    detail?: string;
  };
  comparison?: {
    beforeImage: string; // URL
    beforeType?: 'image' | 'video';
    afterImage: string; // URL
    afterType?: 'image' | 'video';
  };
  gallery?: string[];
  galleryItems?: GalleryItem[];
  galleryGroups?: GalleryGroup[];
  initialCommentCount?: number;
  order: number;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface GalleryGroup {
  id: string;
  name: string;
  description?: string;
  items: GalleryItem[];
}

export interface GalleryItem {
  kind: 'image' | 'video';
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  isActive?: boolean;
  poster?: string;
}

export interface ProjectsData {
  projects: Project[];
  lastUpdated: string;
}

export interface CreateProjectData {
  title: string;
  client: string;
  year: number;
  tags: string[];
  cover: string;
  description: string;
  description_id?: string;
  title_id?: string;
  gallery?: string[];
  // external_link?: string; // Removed
  galleryItems?: GalleryItem[];
  status?: 'published' | 'draft';
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  coverWidth?: number;
  coverHeight?: number;
  likes?: number;
  shares?: number;
  allowComments?: boolean;
  initialCommentCount?: number;
  pdfUrl?: string;

  // New Case Study Fields
  role?: string;
  timeline?: string;
  team?: string;
  software?: string[];
  type?: 'commercial' | 'visual_art';

  narrative?: {
    // Commercial
    context?: string;
    challenge?: string;
    solution?: string;
    impact?: string;
    result?: string;

    // Visual Art
    concept?: string;
    process?: string;
    detail?: string;
  };
  comparison?: {
    beforeImage: string;
    beforeType?: 'image' | 'video';
    afterImage: string;
    afterType?: 'image' | 'video';
  };
  galleryGroups?: GalleryGroup[];
  comments?: Comment[]; // Generated comments for viral package
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string;
  slug?: string;
  comments?: Comment[];
}
