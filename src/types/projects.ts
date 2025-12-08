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
  gallery: string[];
  galleryItems: GalleryItem[];
  description: string;
  external_link: string;
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
  gallery?: string[];
  external_link?: string;
  galleryItems?: GalleryItem[];
  status?: 'published' | 'draft';
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  coverWidth?: number;
  coverHeight?: number;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string;
}
