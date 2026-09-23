import { Project, CreateProjectData, UpdateProjectData } from '@/types/projects';
import { CreateProjectSchema, UpdateProjectSchema } from '@/lib/validations';
import { db } from '@/lib/database';
import { clearProjectCache } from './projectCache';
import { extractProjectAssets, purgeStorageAssets } from './projectStorage';
import { generateUniqueSlug } from './projectSlug';

export async function createProjectRecord(data: CreateProjectData): Promise<Project> {
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
      afterType: 'image',
    },
    order: currentCount + 1,
    status: data.status || 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    db.ref(`projects/${id}`).set(newProject),
    db.ref('lastUpdated').set(new Date().toISOString()),
  ]);

  clearProjectCache();
  return newProject;
}

export async function updateProjectRecord(
  id: string,
  data: UpdateProjectData
): Promise<Project | null> {
  UpdateProjectSchema.parse({ ...data, id });

  const projectRef = db.ref(`projects/${id}`);
  const snap = await projectRef.once('value');
  if (!snap.exists()) return null;

  const currentProject = snap.val();

  if (data.slug && data.slug !== currentProject.slug) {
    const collisionSnap = await db
      .ref('projects')
      .orderByChild('slug')
      .equalTo(data.slug)
      .once('value');
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
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    projectRef.set(updatedProject),
    db.ref('lastUpdated').set(new Date().toISOString()),
  ]);

  clearProjectCache();
  return updatedProject;
}

export async function deleteProjectRecord(id: string): Promise<boolean> {
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

  await Promise.all([projectRef.remove(), db.ref('lastUpdated').set(new Date().toISOString())]);

  clearProjectCache();

  return true;
}

export async function bulkUpdateProjectRecords(updates: {
  ids: string[];
  status?: 'published' | 'draft';
  delete?: boolean;
  reorder?: boolean;
}): Promise<boolean> {
  const projectsRef = db.ref('projects');
  const snap = await projectsRef.once('value');
  if (!snap.exists()) return true;

  const currentProjects = snap.val();
  const dataUpdates: Record<string, unknown> = {};

  if (updates.delete) {
    const allAssetUrls: string[] = [];

    updates.ids.forEach((id) => {
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
    updates.ids.forEach((id) => {
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
}
