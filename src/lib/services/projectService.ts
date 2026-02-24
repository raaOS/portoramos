import { Project, ProjectsData, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { ProjectSchema, CreateProjectSchema, UpdateProjectSchema } from '@/lib/validations/project';
import { db } from '@/lib/firebaseAdmin';

export const projectService = {
    /**
     * Get all projects from Firebase.
     * Implements Zod validation to ensure data integrity.
     */
    async getProjects(status?: string, fresh = false): Promise<{ projects: Project[], lastUpdated: string }> {
        try {
            // Fetch from Firebase
            const projectsRef = db.ref('projects');
            const lastUpdatedRef = db.ref('lastUpdated');

            const [projectsSnap, lastUpdatedSnap] = await Promise.all([
                projectsRef.once('value'),
                lastUpdatedRef.once('value')
            ]);

            let projectsObject = projectsSnap.val() || {};
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

        return updatedProject;
    },

    /**
     * Delete a project from Firebase.
     */
    async deleteProject(id: string): Promise<boolean> {
        const projectRef = db.ref(`projects/${id}`);
        const snap = await projectRef.once('value');
        if (!snap.exists()) return false;

        await Promise.all([
            projectRef.remove(),
            db.ref('lastUpdated').set(new Date().toISOString())
        ]);

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
        const firebaseUpdates: Record<string, any> = {};

        if (updates.delete) {
            updates.ids.forEach(id => {
                firebaseUpdates[`projects/${id}`] = null;
            });
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
        return true;
    }
};
