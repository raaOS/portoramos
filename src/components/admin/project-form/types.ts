import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ProjectFormData } from '@/hooks/useProjectForm';
import type { Comment } from '@/lib/magic';

export type ProjectFormUpdateField = <K extends keyof ProjectFormData>(
  field: K,
  value: ProjectFormData[K]
) => void;

export type ProjectFormTabId = 'ringkasan' | 'proses' | 'galeri';
export type ProjectCreationMode = 'undecided' | 'manual' | 'auto';
export type ProjectMediaFormat = 'single' | 'comparison';

export type GeneratedCommentsRef = MutableRefObject<Comment[] | null>;
export type GeneratedViralFlagRef = MutableRefObject<boolean>;
export type SetComments = Dispatch<SetStateAction<Comment[]>>;
