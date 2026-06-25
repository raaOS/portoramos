import type { EventPage, EventPageSection, EventPageStatus } from '@/types/event-page';

export type EventPageForm = {
  id?: string;
  folderId: string;
  title: string;
  subtitle: string;
  role: string;
  description: string;
  status: EventPageStatus;
  coverFileId: string;
  headerColor: string;
  galleryFileIds: string[];
  sections: EventPageSection[];
};

export function emptyEventPageForm(folderId = ''): EventPageForm {
  return {
    folderId,
    title: '',
    subtitle: '',
    role: '',
    description: '',
    status: 'published',
    coverFileId: '',
    headerColor: '#0f172a',
    galleryFileIds: [],
    sections: [],
  };
}

export function makeEventPageSectionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function eventPageToForm(page: EventPage): EventPageForm {
  return {
    id: page.id,
    folderId: page.folderId,
    title: page.title,
    subtitle: page.subtitle || '',
    role: page.role || '',
    description: page.description,
    status: page.status,
    coverFileId: page.coverFileId || '',
    headerColor: page.headerColor || '#0f172a',
    galleryFileIds: page.galleryFileIds || [],
    sections: page.sections || [],
  };
}
