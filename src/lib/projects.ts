import type { Project } from '@/types/projects';
import projectsData from '@/data/projects.json';

export async function allProjectsAsync(): Promise<Project[]> {
  const list = projectsData.projects as Project[];
  return (list || [])
    .filter(p => p.status !== 'draft')
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0) || (b.year || 0) - (a.year || 0))
}

export async function getProjectBySlugAsync(slug: string): Promise<Project | null> {
  try {
    const list = projectsData.projects as Project[];
    const project = list.find(p => p.slug === slug);
    if (project && project.status === 'draft') return null;
    return project || null;
  } catch {
    return null
  }
}
