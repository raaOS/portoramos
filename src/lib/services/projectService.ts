import { Project, CreateProjectData, UpdateProjectData, ProjectsData } from '@/types/projects';
import { ProjectSchema, CreateProjectSchema, UpdateProjectSchema } from '@/lib/validations/project';
import { db } from '@/lib/firebaseAdmin';
import { githubService } from '@/lib/github';

export const projectService = {
    /**
     * Get all projects from Firebase.
     * Implements Zod validation to ensure data integrity.
     */
    async getProjects(status?: string, fresh = false): Promise<{ projects: Project[], lastUpdated: string }> {
        try {
            // 1. If fresh is requested, or we want to ensure we have data, we can optionally pull from GitHub
            // However, the standard flow is to try Firebase first.
            const projectsRef = db.ref('projects');
            const lastUpdatedRef = db.ref('lastUpdated');

            let projectsSnap = await projectsRef.once('value');
            let projectsObject = projectsSnap.val() || {};

            // 2. FALLBACK/SYNC: If Firebase is empty or 'fresh' is explicitly requested, pull from GitHub
            if (fresh || Object.keys(projectsObject).length === 0) {
                console.log(`[ProjectService] ${fresh ? 'Fresh sync requested' : 'Firebase empty'}, pulling from GitHub...`);
                try {
                    const ghData = await githubService.getFileContent<ProjectsData>('src/data/projects.json', true);
                    if (ghData && ghData.content && Array.from(ghData.content.projects || []).length > 0) {
                        const ghProjects = ghData.content.projects;

                        // Convert Array to Firebase Object Map (id as key)
                        const newFirebaseObject: Record<string, Project> = {};
                        ghProjects.forEach(p => {
                            if (p.id) newFirebaseObject[p.id] = p;
                        });

                        // Seed Firebase
                        await projectsRef.set(newFirebaseObject);
                        await lastUpdatedRef.set(new Date().toISOString());

                        // Update local variable for immediate return
                        projectsObject = newFirebaseObject;
                        console.log(`[ProjectService] Seeded ${ghProjects.length} projects from GitHub to Firebase.`);
                    }
                } catch (ghError) {
                    console.warn('[ProjectService] GitHub sync failed, continuing with Firebase/Empty:', ghError);
                }
            }

            const lastUpdatedSnap = await lastUpdatedRef.once('value');
            let lastUpdated = lastUpdatedSnap.val() || new Date().toISOString();

            // Convert object map to array
            let projects: Project[] = Object.values(projectsObject);

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

            return {
                projects: sortedProjects,
                lastUpdated
            };
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
     */
    async createProject(data: CreateProjectData): Promise<Project> {
        CreateProjectSchema.parse(data);

        // Get current count for order
        const snapshot = await db.ref('projects').once('value');
        const currentCount = snapshot.numChildren();

        // Generate unique slug
        const baseSlug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        let slug = baseSlug;

        // Check for slug collision
        const projectsSnap = await db.ref('projects').orderByChild('slug').equalTo(slug).once('value');
        if (projectsSnap.exists()) {
            slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
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

        // AUTO-SYNC TO GITHUB
        this.asyncSyncToGithub();

        return newProject;
    },

    /**
     * Update an existing project in Firebase.
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
                // Ensure the collision isn't with itself (shouldn't be if data.slug changed)
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

        // AUTO-SYNC TO GITHUB
        this.asyncSyncToGithub();

        return updatedProject;
    },

    /**
     * Delete a project from Firebase and its associated assets from GitHub (Cascade Delete).
     */
    async asyncSyncToGithub() {
        try {
            const projectsRef = db.ref('projects');
            const snap = await projectsRef.once('value');
            const projects = Object.values(snap.val() || {});
            const data = {
                projects,
                lastUpdated: new Date().toISOString()
            };

            // 1. Write to local file
            const fs = await import('fs');
            const path = await import('path');
            const localPath = path.join(process.cwd(), 'src', 'data', 'projects.json');
            const dir = path.dirname(localPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(localPath, JSON.stringify(data, null, 2));
            console.log('[ProjectService] Local projects.json updated.');

            // 2. Push to GitHub
            await githubService.updateFile('src/data/projects.json', data, 'Auto-sync: Project Data Update');
            console.log('[ProjectService] Auto-sync to GitHub successful.');
        } catch (error) {
            console.error('[ProjectService] Auto-sync to GitHub failed:', error);
        }
    },

    async deleteProject(id: string): Promise<boolean> {
        const projectRef = db.ref(`projects/${id}`);
        const snap = await projectRef.once('value');
        if (!snap.exists()) return false;

        const project: Project = snap.val();

        // 1. Cascade Delete Assets from GitHub
        const assetsToDelete = new Set<string>();

        const getPath = (url: string) => {
            if (!url || !url.includes('assets/projects/')) return null;
            // Clean URL and extract relative path
            const parts = url.split('projects/');
            if (parts.length < 2) return null;
            return `public/assets/projects/${parts[1].split('?')[0]}`;
        };

        if (project.cover) {
            const path = getPath(project.cover);
            if (path) assetsToDelete.add(path);
        }

        if (project.comparison) {
            const b = getPath(project.comparison.beforeImage);
            const a = getPath(project.comparison.afterImage);
            if (b) assetsToDelete.add(b);
            if (a) assetsToDelete.add(a);
        }

        if (project.galleryItems) {
            project.galleryItems.forEach(item => {
                const path = getPath(item.src);
                if (path) assetsToDelete.add(path);
            });
        }

        if (project.galleryGroups) {
            project.galleryGroups.forEach(group => {
                group.items.forEach(item => {
                    const path = getPath(item.src);
                    if (path) assetsToDelete.add(path);
                });
            });
        }

        // Execute deletions in background to not block the main response
        Promise.all(Array.from(assetsToDelete).map(path =>
            githubService.deleteFile(path, `Cascade Delete: Project ${id} removed`).catch(e => console.error(`Failed to delete asset ${path}:`, e))
        ));

        // 2. Remove from Firebase
        await Promise.all([
            projectRef.remove(),
            db.ref('lastUpdated').set(new Date().toISOString())
        ]);

        // 3. Trigger sync after delete
        this.asyncSyncToGithub();

        return true;
    },

    /**
     * Bulk update projects in Firebase (Atomic).
     */
    async bulkUpdateProjects(updates: { ids: string[], status?: 'published' | 'draft', delete?: boolean, reorder?: boolean }): Promise<boolean> {
        const projectsRef = db.ref('projects');
        const snap = await projectsRef.once('value');
        if (!snap.exists()) return true;

        const currentProjects = snap.val();
        const firebaseUpdates: Record<string, string | number | boolean | null | object | undefined> = {};

        if (updates.delete) {
            for (const id of updates.ids) {
                await this.deleteProject(id); // Use the enhanced deleteProject for cascade delete
            }
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

        // Trigger sync
        this.asyncSyncToGithub();

        return true;
    }
};
