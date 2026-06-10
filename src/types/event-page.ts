import type { ExplorerFile } from './explorer';

export type EventPageStatus = 'draft' | 'published';

export interface EventPageSection {
  id: string;
  title: string;
  body: string;
  imageFileIds: string[];
}

export interface EventPage {
  id: string;
  folderId: string;
  title: string;
  subtitle?: string;
  role?: string;
  description: string;
  status: EventPageStatus;
  coverFileId?: string;
  headerColor?: string; // hex color for solid hero bg when no cover image
  galleryFileIds: string[];
  sections: EventPageSection[];
  createdAt: string;
  updatedAt: string;
}

export type EventPageInput = Omit<EventPage, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export type EventPageAsset = Pick<
  ExplorerFile,
  | 'id'
  | 'name'
  | 'fileType'
  | 'url'
  | 'previewUrl'
  | 'thumbnailUrl'
  | 'storageKey'
  | 'size'
  | 'updatedAt'
  | 'metadata'
>;

export interface ResolvedEventPage extends EventPage {
  folderName?: string;
  coverFile?: EventPageAsset;
  galleryFiles: EventPageAsset[];
  sectionFiles: Record<string, EventPageAsset[]>;
  missingFileIds: string[];
}
