import type { Locale } from '@/contexts/LanguageContext';
import type { WorkflowStep } from '@/types/about';
import type { WorkExperience } from '@/types/experience';
import type { GalleryGroup, Project } from '@/types/projects';

import { EN_TEXT } from './enTextMap';

export function localizeText(value: string | undefined | null, locale: Locale) {
  if (!value || locale === 'id') return value ?? '';

  if (value.includes('Mau ngobrol soal kerja sama')) {
    return 'Want to talk about collaboration, a project, or anything else? Write here and I will reply soon.';
  }

  const key = value.trim();
  return EN_TEXT[key] ?? value;
}

function localizeTextArray(values: string[] | undefined, locale: Locale) {
  return values?.map((value) => localizeText(value, locale));
}

function localizeGalleryGroups(groups: GalleryGroup[] | undefined, locale: Locale) {
  if (!groups || locale === 'id') return groups;
  return groups.map((group) => ({
    ...group,
    name: localizeText(group.name, locale),
    description: group.description ? localizeText(group.description, locale) : group.description,
  }));
}

export function localizeProject(project: Project, locale: Locale): Project {
  if (locale === 'id') return project;

  return {
    ...project,
    title: localizeText(project.title, locale),
    description: localizeText(project.description, locale),
    role: project.role ? localizeText(project.role, locale) : project.role,
    timeline: project.timeline ? localizeText(project.timeline, locale) : project.timeline,
    team: project.team ? localizeText(project.team, locale) : project.team,
    narrative: project.narrative
      ? {
          ...project.narrative,
          context: localizeText(project.narrative.context, locale),
          challenge: localizeText(project.narrative.challenge, locale),
          solution: localizeText(project.narrative.solution, locale),
          impact: localizeText(project.narrative.impact, locale),
          result: localizeText(project.narrative.result, locale),
          concept: localizeText(project.narrative.concept, locale),
          process: localizeText(project.narrative.process, locale),
          detail: localizeText(project.narrative.detail, locale),
        }
      : project.narrative,
    galleryGroups: localizeGalleryGroups(project.galleryGroups, locale),
  };
}

export function localizeWorkflowSteps(steps: WorkflowStep[] | undefined, locale: Locale) {
  if (!steps || locale === 'id') return steps ?? [];

  return steps.map((step) => ({
    ...step,
    title: localizeText(step.title, locale),
    subtitle: localizeText(step.subtitle, locale),
    description: localizeText(step.description, locale),
    subSteps: step.subSteps?.map((subStep) => ({
      ...subStep,
      title: localizeText(subStep.title, locale),
      description: localizeText(subStep.description, locale),
    })),
  }));
}

export function localizeWorkExperience(job: WorkExperience, locale: Locale): WorkExperience {
  if (locale === 'id') return job;

  return {
    ...job,
    year: localizeText(job.year, locale),
    duration: localizeText(job.duration, locale),
    position: localizeText(job.position, locale),
    description: localizeTextArray(job.description, locale) ?? job.description,
  };
}
