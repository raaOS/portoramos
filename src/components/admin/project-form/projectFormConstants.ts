import { BookOpen, Image as ImageIcon, Info } from 'lucide-react';
import type { ProjectFormTabId } from './types';

export const PROJECT_TYPE_OPTIONS = [
  { value: 'commercial', label: 'Komersial' },
  { value: 'visual_art', label: 'Art Visual' },
] as const;

export const MEDIA_FORMAT_OPTIONS = [
  { id: 'single', label: 'Cover Saja' },
  { id: 'comparison', label: 'Before / After' },
] as const;

export const PROJECT_FORM_TABS = [
  { id: 'ringkasan', label: 'Ringkasan', Icon: Info },
  { id: 'proses', label: 'Proses', Icon: BookOpen },
  { id: 'galeri', label: 'Galeri', Icon: ImageIcon },
] as const satisfies readonly {
  id: ProjectFormTabId;
  label: string;
  Icon: typeof Info;
}[];
