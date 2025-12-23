import type { Project } from '@/types/projects';
import { projectService } from '@/lib/services/projectService';

export async function allProjectsAsync(): Promise<Project[]> {
  // Always fetch FRESH data for homepage to ensure real-time updates (no cache)
  const { projects } = await projectService.getProjects(undefined, true);
  return (projects || [])
    .filter(p => p.status !== 'draft')
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0) || (b.year || 0) - (a.year || 0))
}

export async function getProjectBySlugAsync(slug: string): Promise<Project | null> {
  try {
    const { projects } = await projectService.getProjects();
    const project = projects.find(p => p.slug === slug);
    if (project && project.status === 'draft') return null;
    return project || null;
  } catch {
    return null
  }
}

