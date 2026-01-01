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
            // 2. Production: Prefer Static Import (Fastest, data embedded at build time)
            // Since Vercel rebuilds on GitHub push, this data is up-to-date for the deployment.
            else {
                if (projectsData && (projectsData as any).projects) {
                    data = projectsData as unknown as ProjectsData;
                    // Optional: If 'fresh' is true, we could still force GitHub DB, but for LCP we want speed.
                    // If fresh is requested (e.g. Admin panel sync), we might want to bypass this?
                    // But getProjects() usually called by page.tsx (Server Component) for initial render.
                    if (fresh) {
                        try {
                            const ghData = await githubService.getFile(true);
                            if (ghData && ghData.content) data = ghData.content as ProjectsData;
                        } catch (e: any) {
                            console.error('[ProjectService] Fresh GitHub fetch failed:', e.message);
                            // If forbidden/unauthorized, it's likely Env Vars. If 404, might be private repo without token.
                        }
                    }
                } else {
                    // Fallback if import failed (unlikely)
                    try {
                        const ghData = await githubService.getFile();
                        if (ghData && ghData.content) data = ghData.content as ProjectsData;
                    } catch (error) {
                        console.warn('Failed to fetch from GitHub:', error);
                    }
                }
            }

            // 3. Fallback: Use the statically imported JSON (Duplicate check but safe)
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
            likes: data.likes || 0,
            shares: data.shares || 0,
            allowComments: data.allowComments ?? true,
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
    },

    /**
     * Bulk update projects (Atomic operation)
     */
    async bulkUpdateProjects(updates: { ids: string[], status?: 'published' | 'draft', delete?: boolean }): Promise<boolean> {
        const isDev = process.env.NODE_ENV === 'development';
        let currentProjects: Project[] = [];

        // FETCH EXISTING DATA (Read Once)
        if (isDev) {
            await ensureDataDir();
            const localData = (await loadData(DATA_FILE)) as ProjectsData | null;
            currentProjects = localData?.projects || [];
        } else {
            const ghData = await githubService.getFile();
            currentProjects = ghData.content.projects || [];
        }

        let hasChanges = false;

        // Apply Updates in Memory
        if (updates.delete) {
            const initialLen = currentProjects.length;
            currentProjects = currentProjects.filter(p => !updates.ids.includes(p.id));
            if (currentProjects.length !== initialLen) hasChanges = true;
        } else if (updates.status) {
            currentProjects = currentProjects.map(p => {
                if (updates.ids.includes(p.id) && p.status !== updates.status) {
                    hasChanges = true;
                    return { ...p, status: updates.status!, updatedAt: new Date().toISOString() };
                }
                return p;
            });
        }

        if (!hasChanges) return true; // Nothing to do

        const updatedData = {
            projects: currentProjects,
            lastUpdated: new Date().toISOString()
        };

        // SAVE DATA (Write Once)
        if (isDev) {
            const success = await saveData(DATA_FILE, updatedData);
            if (!success) throw new Error('Failed to save to local filesystem');
        } else {
            const success = await githubService.updateProjects({
                projects: currentProjects,
                message: `Bulk update ${updates.ids.length} projects (via Admin CMS)`
            });
            if (!success) throw new Error('Failed to save to GitHub');
        }

        return true;
    }
};
