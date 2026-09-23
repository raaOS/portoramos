import { isR2StorageConfigured, getMissingR2EnvKeys } from '@/lib/r2Storage';
import {
  buildCategory,
  countByKind,
  describeCategory,
  emptyCounts,
  type CategoryStats,
  type StorageReference,
} from './categoryStats';

interface CategoryReferences {
  wallpaperRefs: StorageReference[];
  projectRefs: StorageReference[];
  iconRefs: StorageReference[];
  explorerManagedRefs: StorageReference[];
  explorerLegacyRefs: StorageReference[];
}

export async function buildCategoryList(
  refs: CategoryReferences,
  warnings: string[]
): Promise<CategoryStats[]> {
  const {
    wallpaperRefs,
    projectRefs,
    iconRefs,
    explorerManagedRefs,
    explorerLegacyRefs,
  } = refs;

  let categories: CategoryStats[];

  if (!isR2StorageConfigured()) {
    warnings.push(
      `Cloudflare R2 env tidak lengkap (${getMissingR2EnvKeys().join(', ')}). R2 counts disabled.`
    );
    categories = [
      {
        id: 'wallpapers',
        label: 'Desktop Wallpaper',
        prefix: 'assets/wallpapers/',
        d1: countByKind(wallpaperRefs),
        r2: emptyCounts(),
        orphans: 0,
        dangling: 0,
        orphanKeys: [],
        danglingPaths: [],
        sidecarCount: 0,
      },
      {
        id: 'projects',
        label: 'Project Assets',
        prefix: 'assets/projects/',
        d1: countByKind(projectRefs),
        r2: emptyCounts(),
        orphans: 0,
        dangling: 0,
        orphanKeys: [],
        danglingPaths: [],
        sidecarCount: 0,
      },
      {
        id: 'hardSkillIcons',
        label: 'Hard Skill & Dock Icons',
        prefix: 'assets/icons-library/',
        d1: countByKind(iconRefs),
        r2: emptyCounts(),
        orphans: 0,
        dangling: 0,
        orphanKeys: [],
        danglingPaths: [],
        sidecarCount: 0,
      },
      {
        id: 'explorer',
        label: 'Explorer Files',
        prefix: 'assets/explorer/',
        d1: countByKind(explorerManagedRefs),
        r2: emptyCounts(),
        orphans: 0,
        dangling: 0,
        orphanKeys: [],
        danglingPaths: [],
        sidecarCount: 0,
      },
      {
        id: 'explorerLegacy',
        label: 'Explorer Legacy Media',
        prefix: 'assets/media/',
        d1: countByKind(explorerLegacyRefs),
        r2: emptyCounts(),
        orphans: 0,
        dangling: 0,
        orphanKeys: [],
        danglingPaths: [],
        sidecarCount: 0,
      },
    ];
  } else {
    categories = await Promise.all([
      buildCategory({
        id: 'wallpapers',
        label: 'Desktop Wallpaper',
        prefix: 'assets/wallpapers/',
        references: wallpaperRefs,
        includeVideoSidecars: true,
      }),
      buildCategory({
        id: 'projects',
        label: 'Project Assets',
        prefix: 'assets/projects/',
        references: projectRefs,
        includeVideoSidecars: true,
      }),
      buildCategory({
        id: 'hardSkillIcons',
        label: 'Hard Skill & Dock Icons',
        prefix: 'assets/icons-library/',
        references: iconRefs,
      }),
      buildCategory({
        id: 'explorer',
        label: 'Explorer Files',
        prefix: 'assets/explorer/',
        references: explorerManagedRefs,
        includeVideoSidecars: true,
      }),
      buildCategory({
        id: 'explorerLegacy',
        label: 'Explorer Legacy Media',
        prefix: 'assets/media/',
        references: explorerLegacyRefs,
        allowUnreferencedR2: true,
      }),
    ]);
  }

  for (const cat of categories) {
    cat.note = describeCategory(cat);
  }

  return categories;
}
