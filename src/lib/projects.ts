import type { Project } from '@/types/projects';
import { projectService } from '@/lib/services/projectService';

export async function allProjectsAsync(): Promise<Project[]> {
  // Use cached data for homepage to ensure instant load (Performance Fix)
  // Revalidation handles updates via standard Next.js ISR/On-Demand Revalidation
  const { projects } = await projectService.getProjects(undefined, false);
  return (projects || [])
    .filter(p => p.status !== 'draft')
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0) || (b.year || 0) - (a.year || 0))
}

export async function getProjectBySlugAsync(slug: string): Promise<Project | null> {
  try {
    const project = await projectService.getProjectBySlug(slug);
    if (project && project.status === 'draft') return null;
    return project || null;
  } catch {
    return null
  }
}

