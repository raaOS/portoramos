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
  narrative?: {
    challenge?: string;
    solution?: string;
    result?: string;
  };
  comparison?: {
    beforeImage: string; // URL
    beforeType?: 'image' | 'video';
    afterImage: string;  // URL
    afterType?: 'image' | 'video';
  };
  // gallery: string[]; // Deprecated
  // galleryItems: GalleryItem[]; // Deprecated
  // external_link: string; // Removed
  order: number;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
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
  narrative?: {
    challenge?: string;
    solution?: string;
    result?: string;
  };
  comparison?: {
    beforeImage: string;
    beforeType?: 'image' | 'video';
    afterImage: string;
    afterType?: 'image' | 'video';
  };
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string;
}
