import { cache } from 'react';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { clearProjectCache, getCacheMetrics } from '@/lib/services/project/projectCache';
import { fetchProjects, fetchProjectBySlug } from '@/lib/services/project/projectQueries';
import {
  createProjectRecord,
  updateProjectRecord,
  deleteProjectRecord,
  bulkUpdateProjectRecords,
} from '@/lib/services/project/projectMutations';

export { clearProjectCache };

/**
 * Cached version of getProjects for Server Components.
 * Menggunakan React.cache untuk menghindari redundant fetch dalam satu request.
 */
export const getCachedProjects = cache(
  async (status?: string): Promise<{ projects: Project[]; lastUpdated: string }> => {
    return projectService.getProjects(status);
  }
);

export const projectService = {
  async getProjects(
    status?: string,
    noCache = false
  ): Promise<{ projects: Project[]; lastUpdated: string }> {
    return fetchProjects(status, noCache);
  },

  async getProjectBySlug(slug: string, noCache = false): Promise<Project | null> {
    return fetchProjectBySlug(slug, noCache);
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    return createProjectRecord(data);
  },

  async updateProject(id: string, data: UpdateProjectData): Promise<Project | null> {
    return updateProjectRecord(id, data);
  },

  async deleteProject(id: string): Promise<boolean> {
    return deleteProjectRecord(id);
  },

  async bulkUpdateProjects(updates: {
    ids: string[];
    status?: 'published' | 'draft';
    delete?: boolean;
    reorder?: boolean;
  }): Promise<boolean> {
    return bulkUpdateProjectRecords(updates);
  },

  getCacheMetrics() {
    return getCacheMetrics();
  },
};
