import { Project, ProjectsData, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { loadData, saveData, ensureDataDir } from '@/lib/backup';
import { githubService } from '@/lib/github';
import projectsData from '@/data/projects.json';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'projects.json');

export const projectService = {
    /**
     * Get all projects, optionally filtered by status
     */
    async getProjects(status?: string, fresh = false): Promise<{ projects: Project[], lastUpdated: string }> {
        try {
            let data: ProjectsData | null = null;
            const isDev = process.env.NODE_ENV === 'development';

            // 1. Development: Try to read from FS
            if (isDev) {
                await ensureDataDir();
                data = (await loadData(DATA_FILE)) as ProjectsData | null;
            }
            // 2. Production: Try to read from GitHub (for freshest data)
            else {
                try {
                    const ghData = await githubService.getFile(fresh);
                    if (ghData && ghData.content) {
                        data = ghData.content as ProjectsData;
                    }
                } catch (error) {
                    console.warn('Failed to fetch from GitHub, falling back to static data:', error);
                }
            }

            // 3. Fallback: Use the statically imported JSON
            if (!data) {
                data = projectsData as unknown as ProjectsData;
            }

            if (!data) {
                return { projects: [], lastUpdated: new Date().toISOString() };
            }

            let projects = data.projects || [];
            if (status) {
                projects = projects.filter((project) => project.status === status);
            }

            const sortedProjects = projects
                .slice()
                .sort(
                    (a, b) =>
                        (a.order || 0) - (b.order || 0) ||
                        (b.year || 0) - (a.year || 0)
                );

            return {
                projects: sortedProjects,
                lastUpdated: data.lastUpdated
            };
        } catch (error) {
            console.error('Error loading projects:', error);
            const fallbackData = projectsData as unknown as ProjectsData;
            return {
                projects: fallbackData?.projects || [],
                lastUpdated: fallbackData?.lastUpdated || new Date().toISOString()
            };
        }
    },

    /**
     * Create a new project
     */
    async createProject(data: CreateProjectData): Promise<Project> {
        const isDev = process.env.NODE_ENV === 'development';
        let currentProjects: Project[] = [];

        // FETCH EXISTING DATA
        if (isDev) {
            await ensureDataDir();
            const localData = (await loadData(DATA_FILE)) as ProjectsData | null;
            currentProjects = localData?.projects || [];
        } else {
            const ghData = await githubService.getFile();
            currentProjects = ghData.content.projects || [];
        }

        // First run fallback for dev if file was empty/null
        if (isDev && !currentProjects.length) {
            const staticData = projectsData as unknown as ProjectsData;
            if (staticData?.projects?.length) {
                currentProjects = [...staticData.projects];
            }
        }

        // Generate new project
        const newProject: Project = {
            ...data,
            id: `project-${Date.now()}`,
            slug: data.title
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, ''),
            cover: data.cover || 'https://via.placeholder.com/800x600',
            autoplay: data.autoplay ?? false,
            muted: data.muted ?? true,
            loop: data.loop ?? false,
            playsInline: data.playsInline ?? true,
            coverWidth: data.coverWidth || 800,
            coverHeight: data.coverHeight || 600,
            gallery: data.gallery || [],
            galleryItems: data.galleryItems || [],
            external_link: data.external_link || '',
            order: currentProjects.length + 1,
            status: data.status || 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Add to list
        const updatedProjects = [...currentProjects, newProject];
        const updatedData = {
            projects: updatedProjects,
            lastUpdated: new Date().toISOString()
        };

        // SAVE DATA
        if (isDev) {
            // Save local FS
            const success = await saveData(DATA_FILE, updatedData);
            if (!success) throw new Error('Failed to save to local filesystem');
        } else {
            // Save to GitHub
            const success = await githubService.updateProjects({
                projects: updatedProjects,
                message: `Add project: ${newProject.title} (via Admin CMS)`
            });
            if (!success) throw new Error('Failed to save to GitHub');
        }

        return newProject;
    },

    /**
     * Update an existing project
     */
    async updateProject(id: string, data: UpdateProjectData): Promise<Project | null> {
        const isDev = process.env.NODE_ENV === 'development';
        let currentProjects: Project[] = [];

        // FETCH EXISTING DATA
        if (isDev) {
            await ensureDataDir();
            const localData = (await loadData(DATA_FILE)) as ProjectsData | null;
            currentProjects = localData?.projects || [];
        } else {
            const ghData = await githubService.getFile();
            currentProjects = ghData.content.projects || [];
        }

        // Find index
        const index = currentProjects.findIndex(p => p.id === id);
        if (index === -1) return null;

        // Update
        const updatedProject = {
            ...currentProjects[index],
            ...data,
            updatedAt: new Date().toISOString()
        };
        currentProjects[index] = updatedProject;

        const updatedData = {
            projects: currentProjects,
            lastUpdated: new Date().toISOString()
        };

        // SAVE DATA
        if (isDev) {
            const success = await saveData(DATA_FILE, updatedData);
            if (!success) throw new Error('Failed to save to local filesystem');
        } else {
            const success = await githubService.updateProjects({
                projects: currentProjects,
                message: `Update project: ${updatedProject.title} (via Admin CMS)`
            });
            if (!success) throw new Error('Failed to save to GitHub');
        }

        return updatedProject;
    },

    /**
     * Delete a project
     */
    async deleteProject(id: string): Promise<boolean> {
        const isDev = process.env.NODE_ENV === 'development';
        let currentProjects: Project[] = [];

        // FETCH EXISTING DATA
        if (isDev) {
            await ensureDataDir();
            const localData = (await loadData(DATA_FILE)) as ProjectsData | null;
            currentProjects = localData?.projects || [];
        } else {
            const ghData = await githubService.getFile();
            currentProjects = ghData.content.projects || [];
        }

        const initialLength = currentProjects.length;
        currentProjects = currentProjects.filter(p => p.id !== id);

        if (currentProjects.length === initialLength) return false; // Not found

        const updatedData = {
            projects: currentProjects,
            lastUpdated: new Date().toISOString()
        };

        // SAVE DATA
        if (isDev) {
            const success = await saveData(DATA_FILE, updatedData);
            if (!success) throw new Error('Failed to save to local filesystem');
        } else {
            const success = await githubService.updateProjects({
                projects: currentProjects,
                message: `Delete project ID: ${id} (via Admin CMS)`
            });
            if (!success) throw new Error('Failed to save to GitHub');
        }

        return true;
    }
};
