import type { GalleryGroup, Project } from '@/types/projects';

export type ProjectTranslations = Record<string, string>;

const TOP_LEVEL_TRANSLATABLE_FIELDS = ['title', 'description', 'role', 'timeline', 'team'] as const;

function addTextField(fields: ProjectTranslations, key: string, value: unknown) {
  if (typeof value !== 'string') return;
  const text = value.trim();
  if (!text) return;
  fields[key] = text;
}

export function getGalleryGroupTranslationKey(
  group: Pick<GalleryGroup, 'id'>,
  index: number,
  field: 'name' | 'description'
) {
  return `galleryGroups.${group.id || index}.${field}`;
}

export function collectProjectTranslationFields(project: Project): ProjectTranslations {
  const fields: ProjectTranslations = {};

  TOP_LEVEL_TRANSLATABLE_FIELDS.forEach((key) => {
    addTextField(fields, key, project[key]);
  });

  if (project.narrative) {
    Object.entries(project.narrative).forEach(([key, value]) => {
      addTextField(fields, `narrative.${key}`, value);
    });

    const challenge = project.narrative.challenge || project.narrative.concept;
    const solution = project.narrative.solution || project.narrative.process;
    const impact = project.narrative.impact || project.narrative.result || project.narrative.detail;

    addTextField(fields, 'context', project.narrative.context);
    addTextField(fields, 'challenge', challenge);
    addTextField(fields, 'solution', solution);
    addTextField(fields, 'impact', impact);
  }

  project.galleryGroups?.forEach((group, index) => {
    addTextField(fields, getGalleryGroupTranslationKey(group, index, 'name'), group.name);
    addTextField(
      fields,
      getGalleryGroupTranslationKey(group, index, 'description'),
      group.description
    );
  });

  return fields;
}

export function getTranslation(
  translations: ProjectTranslations | null | undefined,
  ...keys: Array<string | false | null | undefined>
) {
  if (!translations) return undefined;

  for (const key of keys) {
    if (!key) continue;
    const translated = translations[key];
    if (typeof translated === 'string' && translated.trim()) {
      return translated;
    }
  }

  return undefined;
}
