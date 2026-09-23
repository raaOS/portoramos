import { extractStoragePath } from '@/lib/urlResolver';
import { aboutService } from '@/lib/services/aboutService';
import { projectService } from '@/lib/services/projectService';
import { hardSkillService } from '@/lib/services/hardSkillService';
import { explorerService } from '@/lib/services/explorerService';
import { extractProjectAssets } from '@/lib/services/project/projectStorage';
import type { StorageReference } from './categoryStats';

export async function safeCollect<T>(
  label: string,
  warnings: string[],
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown error';
    console.warn(`[storage-stats] ${label} failed: ${msg}`);
    warnings.push(`${label}: ${msg}`);
    return fallback;
  }
}

export async function collectAllStorageReferences(warnings: string[]): Promise<{
  wallpaperRefs: StorageReference[];
  projectRefs: StorageReference[];
  iconRefs: StorageReference[];
  explorerManagedRefs: StorageReference[];
  explorerLegacyRefs: StorageReference[];
}> {
  const [aboutData, projectsBundle, hardSkillData] = await Promise.all([
    safeCollect('aboutService', warnings, () => aboutService.getAboutData(true), null),
    safeCollect('projectService', warnings, () => projectService.getProjects(undefined, true), {
      projects: [],
      lastUpdated: '',
    }),
    safeCollect('hardSkillService', warnings, () => hardSkillService.getHardSkills(true), {
      skills: [],
      lastUpdated: '',
    } as Awaited<ReturnType<typeof hardSkillService.getHardSkills>>),
  ]);

  // Wallpapers
  const wallpaperRefs: StorageReference[] = [];
  const wallpaperCollection = aboutData?.wallpaperConfig?.collection || [];
  for (const w of wallpaperCollection) {
    if (w?.url) {
      wallpaperRefs.push({ url: w.url, storagePath: extractStoragePath(w.url) });
    }
    if (w?.posterUrl) {
      wallpaperRefs.push({
        url: w.posterUrl,
        storagePath: extractStoragePath(w.posterUrl),
      });
    }
  }

  // Projects
  const projectRefs: StorageReference[] = [];
  for (const p of projectsBundle.projects) {
    const urls = extractProjectAssets(p);
    for (const url of urls) {
      projectRefs.push({ url, storagePath: extractStoragePath(url) });
    }
  }

  // Hard skill and Dock icons
  const iconRefs: StorageReference[] = [];
  for (const skill of hardSkillData.skills || []) {
    if (skill?.iconUrl) {
      iconRefs.push({
        url: skill.iconUrl,
        storagePath: extractStoragePath(skill.iconUrl),
      });
    }
  }

  const dockConfig = aboutData?.dockConfig || {};
  for (const key of Object.keys(dockConfig)) {
    const item = dockConfig[key];
    if (item?.iconUrl) {
      iconRefs.push({
        url: item.iconUrl,
        storagePath: extractStoragePath(item.iconUrl),
      });
    }
  }

  // Explorer files
  const explorerRefs: StorageReference[] = [];
  const explorerNodes = await safeCollect(
    'explorerService',
    warnings,
    () => explorerService.getAllNodes(),
    [] as Awaited<ReturnType<typeof explorerService.getAllNodes>>
  );
  for (const node of explorerNodes) {
    if (node.type !== 'file') continue;
    explorerRefs.push({
      url: node.url,
      storagePath: node.storageKey || extractStoragePath(node.url),
    });
    if (node.previewUrl || node.previewKey) {
      explorerRefs.push({
        url: node.previewUrl || node.previewKey || '',
        storagePath:
          node.previewKey || (node.previewUrl ? extractStoragePath(node.previewUrl) : null),
      });
    }
    if (node.thumbnailUrl || node.thumbnailKey) {
      explorerRefs.push({
        url: node.thumbnailUrl || node.thumbnailKey || '',
        storagePath:
          node.thumbnailKey || (node.thumbnailUrl ? extractStoragePath(node.thumbnailUrl) : null),
      });
    }
  }

  const explorerManagedRefs = explorerRefs.filter((ref) =>
    ref.storagePath?.startsWith('assets/explorer/')
  );
  const explorerLegacyRefs = explorerRefs.filter((ref) =>
    ref.storagePath?.startsWith('assets/media/')
  );

  return {
    wallpaperRefs,
    projectRefs,
    iconRefs,
    explorerManagedRefs,
    explorerLegacyRefs,
  };
}
