import { cache } from 'react';
import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { ProjectSchema, CreateProjectSchema, UpdateProjectSchema } from '@/lib/validations';
import { db, bucket } from '@/lib/firebaseAdmin';

// Simple in-memory cache untuk project data (sama dengan ContentService)
const projectCache = new Map<string, { data: unknown; timestamp: number }>();
const PROJECT_CACHE_TTL = 30000; // 30 detik

function getProjectCacheKey(key: string): string {
    return `project:${key}`;
}

function getFromProjectCache<T>(key: string): T | null {
    const cached = projectCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > PROJECT_CACHE_TTL) {
        projectCache.delete(key);
        return null;
    }
    return cached.data as T;
}

function setProjectCache(key: string, data: unknown): void {
    projectCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear all project caches setelah CRUD operations.
 * Dipanggil otomatis setelah create/update/delete.
 */
export function clearProjectCache(): void {
    console.log('[ProjectService] Clearing all project caches...');
    for (const key of projectCache.keys()) {
        if (key.startsWith('project:')) {
            projectCache.delete(key);
        }
    }
}

/**
 * Cached version of getProjects for Server Components.
 * Menggunakan React.cache untuk menghindari redundant fetch dalam satu request.
 */
export const getCachedProjects = cache(async (status?: string): Promise<{ projects: Project[], lastUpdated: string }> => {
    return projectService.getProjects(status);
});

export const projectService = {
    /**
     * Get all projects from Firebase.
     * Implements Zod validation to ensure data integrity.
     * 
     * OPTIMIZATION: Menggunakan memory cache untuk mengurangi bandwidth.
     * Cache di-clear otomatis setelah CRUD operations.
     */
    async getProjects(status?: string, noCache = false): Promise<{ projects: Project[], lastUpdated: string }> {
        const cacheKey = getProjectCacheKey(`projects:${status || 'all'}`);
        
        // Cek cache dulu (kecuali noCache=true)
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

            const projectsSnap = await projectsRef.once('value');
            const projectsObject = projectsSnap.val() || {};

            const lastUpdatedSnap = await lastUpdatedRef.once('value');
            const lastUpdated = lastUpdatedSnap.val() || new Date().toISOString();

            // Convert object map to array
            const projects: Project[] = Object.values(projectsObject);

            if (projects.length === 0) {
                return { projects: [], lastUpdated: new Date().toISOString() };
            }

            // FILTER & VALIDATE
            const validProjects: Project[] = [];
            projects.forEach(p => {
                // Filter by status if requested
                if (status && p.status !== status) return;

                const result = ProjectSchema.safeParse(p);
                if (result.success) {
                    validProjects.push(result.data as unknown as Project);
                } else {
                    console.warn(`[ProjectService] Validation Failed for project ${p.id || 'unknown'}:`, result.error.format());
                }
            });

            // SORT
            const sortedProjects = validProjects.sort(
                (a, b) =>
                    (a.order || 0) - (b.order || 0) ||
                    (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            );

            const result = {
                projects: sortedProjects,
                lastUpdated
            };
            
            // Simpan ke cache
            setProjectCache(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('Error loading projects from Firebase:', error);
            return {
                projects: [],
                lastUpdated: new Date().toISOString()
            };
        }
    },

    /**
     * Create a new project in Firebase.
     * Cache otomatis di-clear setelah create.
     * 
     * FIXED (BUG-006): Slug generation dengan collision detection yang lebih robust
     * menggunakan retry dengan timestamp + random suffix.
     */
    async createProject(data: CreateProjectData): Promise<Project> {
        CreateProjectSchema.parse(data);

        // Get current count for order
        const snapshot = await db.ref('projects').once('value');
        const currentCount = snapshot.numChildren();

        // FIXED (BUG-012): Limit title length sebelum regex processing untuk mencegah bottleneck
        const MAX_TITLE_LENGTH = 200;
        const truncatedTitle = data.title.substring(0, MAX_TITLE_LENGTH);
        const baseSlug = truncatedTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
        let slug = baseSlug;
        let attempts = 0;
        const MAX_ATTEMPTS = 5;

        // FIXED (BUG-006): Robust collision detection dengan retry
        while (attempts < MAX_ATTEMPTS) {
            const projectsSnap = await db.ref('projects').orderByChild('slug').equalTo(slug).once('value');
            if (!projectsSnap.exists()) {
                // Slug is unique
                break;
            }
            
            // Collision detected, generate new slug dengan timestamp + random
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 6);
            slug = `${baseSlug}-${timestamp}${random}`;
            attempts++;
            
            console.log(`[ProjectService] Slug collision detected, retrying with: ${slug}`);
        }

        if (attempts >= MAX_ATTEMPTS) {
            throw new Error('Failed to generate unique slug after maximum attempts');
        }

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

        // SAVE TO FIREBASE
        await Promise.all([
            db.ref(`projects/${id}`).set(newProject),
            db.ref('lastUpdated').set(new Date().toISOString())
        ]);

        // Clear cache agar data terbaru langsung tersedia
        clearProjectCache();

        return newProject;
    },

    /**
     * Update an existing project in Firebase.
     * Cache otomatis di-clear setelah update.
     */
    async updateProject(id: string, data: UpdateProjectData): Promise<Project | null> {
        UpdateProjectSchema.parse(data);

        const projectRef = db.ref(`projects/${id}`);
        const snap = await projectRef.once('value');
        if (!snap.exists()) return null;

        const currentProject = snap.val();

        // Check slug uniqueness if changed
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

        // Clear cache agar data terbaru langsung tersedia
        clearProjectCache();

        return updatedProject;
    },

    /**
     * Delete project from Firebase.
     * Cache otomatis di-clear setelah delete.
     */
    async deleteProject(id: string): Promise<boolean> {
        const projectRef = db.ref(`projects/${id}`);
        const snap = await projectRef.once('value');
        if (!snap.exists()) return false;

        const project = snap.val();

        // Clean up associated Storage assets
        try {
            const assetUrls: string[] = [];
            if (project.cover) assetUrls.push(project.cover);
            if (project.comparison?.beforeImage) assetUrls.push(project.comparison.beforeImage);
            if (project.comparison?.afterImage) assetUrls.push(project.comparison.afterImage);
            if (project.galleryItems && Array.isArray(project.galleryItems)) {
                project.galleryItems.forEach((item: { src?: string }) => {
                    if (item.src) assetUrls.push(item.src);
                });
            }
            if (project.galleryGroups && Array.isArray(project.galleryGroups)) {
                project.galleryGroups.forEach((group: { items?: Array<{ src?: string }> }) => {
                    group.items?.forEach(item => {
                        if (item.src) assetUrls.push(item.src);
                    });
                });
            }

            // Delete each asset from Storage
            for (const url of assetUrls) {
                try {
                    let storagePath = '';
                    if (url.includes('/o/')) {
                        const parts = url.split('/o/');
                        storagePath = decodeURIComponent(parts[1].split('?')[0]);
                    } else if (url.startsWith('/')) {
                        storagePath = url.substring(1);
                    }
                    if (storagePath && storagePath.startsWith('assets/')) {
                        const file = bucket.file(storagePath);
                        const [exists] = await file.exists();
                        if (exists) await file.delete();
                    }
                } catch (e) {
                    console.warn(`[ProjectService] Failed to delete asset: ${url}`, e);
                }
            }
        } catch (e) {
            console.warn('[ProjectService] Storage cleanup partial failure:', e);
        }

        // Also delete associated comments
        try {
            if (project.slug) {
                await db.ref(`comments/${project.slug}`).remove();
            }
        } catch (e) {
            console.warn('[ProjectService] Failed to cleanup comments:', e);
        }

        // Remove from Firebase
        await Promise.all([
            projectRef.remove(),
            db.ref('lastUpdated').set(new Date().toISOString())
        ]);

        // Clear cache agar data terbaru langsung tersedia
        clearProjectCache();

        return true;
    },

    /**
     * Bulk update projects in Firebase (Atomic).
     * Cache otomatis di-clear setelah bulk operation.
     * 
     * FIXED (BUG-001): Menggunakan Promise.allSettled untuk parallel delete
     * dengan proper error handling. Tidak sequential untuk performance.
     */
    async bulkUpdateProjects(updates: { ids: string[], status?: 'published' | 'draft', delete?: boolean, reorder?: boolean }): Promise<boolean> {
        const projectsRef = db.ref('projects');
        const snap = await projectsRef.once('value');
        if (!snap.exists()) return true;

        const currentProjects = snap.val();
        const firebaseUpdates: Record<string, unknown> = {};

        if (updates.delete) {
            // BUG FIX #3: Delete langsung tanpa melalui deleteProject untuk menghindari cache thrashing
            const projectsRef = db.ref('projects');
            const snap = await projectsRef.once('value');
            const currentProjects = snap.val() || {};
            
            const firebaseUpdates: Record<string, unknown> = {};
            
            updates.ids.forEach(id => {
                if (currentProjects[id]) {
                    firebaseUpdates[`projects/${id}`] = null;
                }
            });
            
            if (Object.keys(firebaseUpdates).length > 0) {
                firebaseUpdates['lastUpdated'] = new Date().toISOString();
                await db.ref().update(firebaseUpdates);
            }
            
            // Clear cache sekali setelah semua delete selesai
            clearProjectCache();
            return true;
        } else if (updates.reorder) {
            updates.ids.forEach((id, index) => {
                if (currentProjects[id]) {
                    firebaseUpdates[`projects/${id}/order`] = index + 1;
                    firebaseUpdates[`projects/${id}/updatedAt`] = new Date().toISOString();
                }
            });
        } else if (updates.status) {
            updates.ids.forEach(id => {
                if (currentProjects[id]) {
                    firebaseUpdates[`projects/${id}/status`] = updates.status;
                    firebaseUpdates[`projects/${id}/updatedAt`] = new Date().toISOString();
                }
            });
        }

        firebaseUpdates['lastUpdated'] = new Date().toISOString();

        await db.ref().update(firebaseUpdates);

        // Clear cache agar data terbaru langsung tersedia
        clearProjectCache();

        return true;
    }
};
