import { cache } from 'react';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { ProjectSchema, CreateProjectSchema, UpdateProjectSchema } from '@/lib/validations';
import { db } from '@/lib/database';

// Helper Submodules
import { 
    getProjectCacheKey, 
    getFromProjectCache, 
    setProjectCache, 
    clearProjectCache, 
    getCacheMetrics 
} from '@/lib/services/project/projectCache';
import { extractProjectAssets, purgeStorageAssets } from '@/lib/services/project/projectStorage';
import { generateUniqueSlug } from '@/lib/services/project/projectSlug';

function normalizeProject(project: Project): Project {
    if (!project.galleryGroups?.length) {
        return project;
    }

    return {
        ...project,
        galleryGroups: project.galleryGroups.map((group, index) => ({
            ...group,
            id: group.id || `${project.id}-group-${index}`
        }))
    };
}

export { clearProjectCache };

/**
 * Cached version of getProjects for Server Components.
 * Menggunakan React.cache untuk menghindari redundant fetch dalam satu request.
 */
export const getCachedProjects = cache(async (status?: string): Promise<{ projects: Project[], lastUpdated: string }> => {
    return projectService.getProjects(status);
});

export const projectService = {
    async getProjects(status?: string, noCache = false): Promise<{ projects: Project[], lastUpdated: string }> {
        const cacheKey = getProjectCacheKey(`projects:${status || 'all'}`);

        if (!noCache) {
            const cached = getFromProjectCache<{ projects: Project[], lastUpdated: string }>(cacheKey);
            if (cached) {
                console.log(`[ProjectService] Cache hit for projects:${status || 'all'}`);
                return cached;
            }
        }

        try {
            const projectsRef = db.ref('projects');
            const lastUpdatedRef = db.ref('lastUpdated');

            const [projectsSnap, lastUpdatedSnap] = await Promise.all([
                projectsRef.once('value'),
                lastUpdatedRef.once('value')
            ]);
            const projectsObject = projectsSnap.val() || {};
            const lastUpdated = lastUpdatedSnap.val() || new Date().toISOString();

            const projects: Project[] = Object.values(projectsObject);

            if (projects.length === 0) {
                return { projects: [], lastUpdated: new Date().toISOString() };
            }

            const validProjects: Project[] = [];
            projects.forEach(p => {
                if (status && p.status !== status) return;

                const result = ProjectSchema.safeParse(p);
                if (result.success) {
                    validProjects.push(normalizeProject(result.data as unknown as Project));
                } else {
                    console.warn(`[ProjectService] Validation Failed for project ${p.id || 'unknown'}:`, result.error.format());
                }
            });

            const sortedProjects = validProjects.sort(
                (a, b) =>
                    (a.order || 0) - (b.order || 0) ||
                    (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            );

            const result = {
                projects: sortedProjects,
                lastUpdated
            };

            setProjectCache(cacheKey, result);

            return result;
        } catch (error) {
            console.error('Error loading projects from data backend:', error);
            return {
                projects: [],
                lastUpdated: new Date().toISOString()
            };
        }
    },

    async getProjectBySlug(slug: string, noCache = false): Promise<Project | null> {
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
                console.warn(`[ProjectService] Validation failed for slug ${slug}:`, validation.error.format());
                return null;
            }

            const normalizedProject = normalizeProject(validation.data as unknown as Project);
            setProjectCache(cacheKey, normalizedProject);
            return normalizedProject;
        } catch (error) {
            console.error(`[ProjectService] Error loading project slug ${slug}:`, error);
            return null;
        }
    },

    async createProject(data: CreateProjectData): Promise<Project> {
        CreateProjectSchema.parse(data);

        const snapshot = await db.ref('projects').once('value');
        const currentCount = snapshot.numChildren();

        const slug = await generateUniqueSlug(data.title);
        const id = `project-${Date.now()}`;
        
        const newProject: Project = {
            ...data,
            id,
            slug,
            cover: data.cover || 'https://via.placeholder.com/800x600',
            autoplay: data.autoplay ?? false,
            muted: data.muted ?? true,
            loop: data.loop ?? false,
            playsInline: data.playsInline ?? true,
            coverWidth: data.coverWidth || 800,
            coverHeight: data.coverHeight || 600,
            likes: data.likes || 0,
            shares: data.shares || 0,
            allowComments: data.allowComments ?? true,
            comparison: data.comparison || {
                beforeImage: '',
                beforeType: 'image',
                afterImage: '',
                afterType: 'image'
            },
            order: currentCount + 1,
            status: data.status || 'published',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await Promise.all([
            db.ref(`projects/${id}`).set(newProject),
            db.ref('lastUpdated').set(new Date().toISOString())
        ]);

        clearProjectCache();
        return newProject;
    },

    async updateProject(id: string, data: UpdateProjectData): Promise<Project | null> {
        UpdateProjectSchema.parse({ ...data, id });

        const projectRef = db.ref(`projects/${id}`);
        const snap = await projectRef.once('value');
        if (!snap.exists()) return null;

        const currentProject = snap.val();

        if (data.slug && data.slug !== currentProject.slug) {
            const collisionSnap = await db.ref('projects').orderByChild('slug').equalTo(data.slug).once('value');
            if (collisionSnap.exists()) {
                const collisionData = collisionSnap.val();
                if (Object.keys(collisionData)[0] !== id) {
                    data.slug = `${data.slug}-${Date.now().toString().slice(-4)}`;
                }
            }
        }

        const updatedProject = {
            ...currentProject,
            ...data,
            updatedAt: new Date().toISOString()
        };

        await Promise.all([
            projectRef.set(updatedProject),
            db.ref('lastUpdated').set(new Date().toISOString())
        ]);

        clearProjectCache();
        return updatedProject;
    },

    async deleteProject(id: string): Promise<boolean> {
        const projectRef = db.ref(`projects/${id}`);
        const snap = await projectRef.once('value');
        if (!snap.exists()) return false;

        const project = snap.val();

        try {
            const assetUrls = extractProjectAssets(project);
            await purgeStorageAssets(assetUrls);
        } catch (e) {
            console.warn('[ProjectService] Storage cleanup partial failure:', e);
        }

        try {
            if (project.slug) {
                await db.ref(`comments/${project.slug}`).remove();
            }
        } catch (e) {
            console.warn('[ProjectService] Failed to cleanup comments:', e);
        }

        await Promise.all([
            projectRef.remove(),
            db.ref('lastUpdated').set(new Date().toISOString())
        ]);

        clearProjectCache();

        return true;
    },

    async bulkUpdateProjects(updates: { ids: string[], status?: 'published' | 'draft', delete?: boolean, reorder?: boolean }): Promise<boolean> {
        const projectsRef = db.ref('projects');
        const snap = await projectsRef.once('value');
        if (!snap.exists()) return true;

        const currentProjects = snap.val();
        const dataUpdates: Record<string, unknown> = {};

        if (updates.delete) {
            const allAssetUrls: string[] = [];

            updates.ids.forEach(id => {
                const project = currentProjects[id];
                if (project) {
                    dataUpdates[`projects/${id}`] = null;
                    const projectAssets = extractProjectAssets(project);
                    allAssetUrls.push(...projectAssets);
                }
            });

            if (allAssetUrls.length > 0) {
                await purgeStorageAssets(allAssetUrls);
            }

            if (Object.keys(dataUpdates).length > 0) {
                dataUpdates['lastUpdated'] = new Date().toISOString();
                await db.ref().update(dataUpdates);
            }

            clearProjectCache();
            return true;
            
        } else if (updates.reorder) {
            updates.ids.forEach((id, index) => {
                if (currentProjects[id]) {
                    dataUpdates[`projects/${id}/order`] = index + 1;
                    dataUpdates[`projects/${id}/updatedAt`] = new Date().toISOString();
                }
            });
        } else if (updates.status) {
            updates.ids.forEach(id => {
                if (currentProjects[id]) {
                    dataUpdates[`projects/${id}/status`] = updates.status;
                    dataUpdates[`projects/${id}/updatedAt`] = new Date().toISOString();
                }
            });
        }

        dataUpdates['lastUpdated'] = new Date().toISOString();
        await db.ref().update(dataUpdates);

        clearProjectCache();
        return true;
    },

    getCacheMetrics() {
        return getCacheMetrics();
    }
};

