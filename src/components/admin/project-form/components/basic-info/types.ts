import { ProjectFormData } from '@/hooks/useProjectForm';

export type ProjectBasicInfoUpdateField = <K extends keyof ProjectFormData>(
  field: K,
  value: ProjectFormData[K]
) => void;

export interface SoftwareCategory {
  title: string;
  items: string[];
}
