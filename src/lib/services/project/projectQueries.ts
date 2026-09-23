import { Project } from '@/types/projects';
import { ProjectSchema } from '@/lib/validations';
import { db } from '@/lib/database';
import {
  getProjectCacheKey,
  getFromProjectCache,
  setProjectCache,
} from './projectCache';

export function normalizeProject(project: Project): Project {
  if (!project.galleryGroups?.length) {
    return project;
  }

  return {
    ...project,
    galleryGroups: project.galleryGroups.map((group, index) => ({
      ...group,
      id: group.id || `${project.id}-group-${index}`,
    })),
  };
}

export async function fetchProjects(
  status?: string,
  noCache = false
): Promise<{ projects: Project[]; lastUpdated: string }> {
  const cacheKey = getProjectCacheKey(`projects:${status || 'all'}`);

  if (!noCache) {
    const cached = getFromProjectCache<{ projects: Project[]; lastUpdated: string }>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const projectsRef = db.ref('projects');
    const lastUpdatedRef = db.ref('lastUpdated');

    const [projectsSnap, lastUpdatedSnap] = await Promise.all([
      projectsRef.once('value'),
      lastUpdatedRef.once('value'),
    ]);
    const projectsObject = projectsSnap.val() || {};
    const lastUpdated = lastUpdatedSnap.val() || new Date().toISOString();

    const projects: Project[] = Object.values(projectsObject);

    if (projects.length === 0) {
      return { projects: [], lastUpdated: new Date().toISOString() };
    }

    const validProjects: Project[] = [];
    projects.forEach((p) => {
      if (status && p.status !== status) return;

      const result = ProjectSchema.safeParse(p);
      if (result.success) {
        validProjects.push(normalizeProject(result.data as unknown as Project));
      } else {
        console.warn(
          `[ProjectService] Validation Failed for project ${p.id || 'unknown'}:`,
          result.error.format()
        );
      }
    });

    const sortedProjects = validProjects.sort(
      (a, b) =>
        (a.order || 0) - (b.order || 0) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const result = {
      projects: sortedProjects,
      lastUpdated,
    };

    setProjectCache(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error loading projects from data backend:', error);
    return {
      projects: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export async function fetchProjectBySlug(slug: string, noCache = false): Promise<Project | null> {
  const cacheKey = getProjectCacheKey(`project-slug:${slug}`);

  if (!noCache) {
    const cached = getFromProjectCache<Project | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  try {
    const projectSnap = await db.ref('projects').orderByChild('slug').equalTo(slug).once('value');
    const projectMap = projectSnap.val() || {};
    const project = Object.values(projectMap)[0] as Project | undefined;

    if (!project) {
      setProjectCache(cacheKey, null);
      return null;
    }

    const validation = ProjectSchema.safeParse(project);
    if (!validation.success) {
      console.warn(
        `[ProjectService] Validation failed for slug ${slug}:`,
        validation.error.format()
      );
      return null;
    }

    const normalizedProject = normalizeProject(validation.data as unknown as Project);
    setProjectCache(cacheKey, normalizedProject);
    return normalizedProject;
  } catch (error) {
    console.error(`[ProjectService] Error loading project slug ${slug}:`, error);
    return null;
  }
}
