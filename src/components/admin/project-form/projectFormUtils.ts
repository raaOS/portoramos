import type { ProjectFormData } from '@/hooks/useProjectForm';

export type AIUpdatableField = keyof Pick<
  ProjectFormData,
  | 'title'
  | 'description'
  | 'client'
  | 'role'
  | 'team'
  | 'timeline'
  | 'software'
  | 'narrative'
  | 'tags'
  | 'likes'
  | 'shares'
  | 'allowComments'
>;

export function countFilledProjectContentFields(formData: ProjectFormData) {
  const textFields = [
    formData.title,
    formData.description,
    formData.client,
    formData.role,
    formData.team,
    formData.timeline,
    formData.tags,
    ...Object.values(formData.narrative || {}),
  ];

  const filledTextCount = textFields.filter(
    (value) => typeof value === 'string' && value.trim().length > 0
  ).length;
  const hasCustomSoftware = (formData.software || []).some((tool) => {
    const normalizedTool = tool.trim().toLowerCase();
    return normalizedTool.length > 0 && normalizedTool !== 'photoshop';
  });

  return filledTextCount + (hasCustomSoftware ? 1 : 0);
}

export function createPreviewSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function hasProjectFormTabErrors(
  errors: Record<string, string>,
  tabId: 'ringkasan' | 'proses' | 'galeri'
) {
  if (!errors || Object.keys(errors).length === 0) return false;

  if (tabId === 'ringkasan') {
    return !!(
      errors.title ||
      errors.slug ||
      errors.description ||
      errors.client ||
      errors.role ||
      errors.team ||
      errors.timeline ||
      errors.software ||
      errors.likes ||
      errors.shares ||
      errors.cover
    );
  }

  if (tabId === 'proses') {
    return !!(
      errors['narrative.about'] ||
      errors['narrative.challenge'] ||
      errors['narrative.solution'] ||
      errors['narrative.impact'] ||
      Object.keys(errors).some((key) => key.startsWith('narrative.'))
    );
  }

  return !!(errors.gallery || Object.keys(errors).some((key) => key.startsWith('gallery')));
}
