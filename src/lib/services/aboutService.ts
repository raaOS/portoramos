import { cache } from 'react';
import { ContentService } from './contentService';
import {
  AboutData,
  UpdateAboutData,
  DesignPhilosophy,
  DesktopPreferences,
  WallpaperConfig,
  DockPreferences,
  WindowPreferences,
  SoundConfig,
} from '@/types/about';
import aboutDataFallback from '@/data/about.json';
import { deleteStorageAssets } from '@/lib/services/storageCleanup';

const service = new ContentService<AboutData>(
  'about.json',
  aboutDataFallback as unknown as AboutData
);

function mergeDesktopPreferences(
  current?: DesktopPreferences,
  updates?: Partial<DesktopPreferences>
): DesktopPreferences | undefined {
  if (!current && !updates) {
    return undefined;
  }

  return {
    ...(current || {}),
    ...(updates || {}),
    iconPositions: {
      ...(current?.iconPositions || {}),
      ...(updates?.iconPositions || {}),
    },
  } as DesktopPreferences;
}

function mergeWindowPreferences(
  current?: WindowPreferences,
  updates?: WindowPreferences
): WindowPreferences | undefined {
  if (!current && !updates) {
    return undefined;
  }

  const merged: WindowPreferences = {
    ...(current || {}),
  };

  Object.entries(updates || {}).forEach(([id, preference]) => {
    merged[id] = {
      ...(current?.[id] || {}),
      ...preference,
    };
  });

  return merged;
}

/**
 * Extract all media URLs from AboutData for storage cleanup.
 */
function extractAboutAssets(data: AboutData): string[] {
  const assets: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((data.hero as any)?.avatarUrl) assets.push((data.hero as any).avatarUrl);

  if (data.wallpaperConfig?.collection) {
    data.wallpaperConfig.collection.forEach((w) => {
      if (w.url) assets.push(w.url);
      if (w.posterUrl) assets.push(w.posterUrl);
    });
  }

  if (data.soundConfig) {
    if (data.soundConfig.startupSound?.path) assets.push(data.soundConfig.startupSound.path);
    if (data.soundConfig.notificationSound?.path) assets.push(data.soundConfig.notificationSound.path);
    if (data.soundConfig.errorSound?.path) assets.push(data.soundConfig.errorSound.path);
    if (data.soundConfig.successSound?.path) assets.push(data.soundConfig.successSound.path);
  }

  return assets;
}

/**
 * Cached version untuk Server Components.
 * Menghindari redundant fetch ke CLOUDFLARE_D1 dalam satu request.
 */
export const getCachedAboutData = cache(async () => {
  return aboutService.getAboutData();
});

export const aboutService = {
  /**
   * Retrieves the current "About" page data.
   * Uses ContentService for persistence and fallback logic.
   *
   * @returns A promise that resolves to the AboutData.
   */
  async getAboutData(noCache = false) {
    return await service.getData(noCache);
  },

  /**
   * Updates the "About" page data with partial updates.
   * Performs an explicit deep merge for nested configuration objects.
   *
   * @param updates - The partial data to update.
   * @returns A promise that resolves to the updated merged data.
   */
  async updateAboutData(updates: UpdateAboutData) {
    try {
      const current = await this.getAboutData(true);

      // Explicit merging since updates contains Partials
      const mergedData: AboutData = {
        ...current, // Preserve all base fields (notifications, etc)
        hero: { ...current.hero, ...(updates.hero || {}) },
        professional: { ...current.professional, ...(updates.professional || {}) },
        softSkills: { ...current.softSkills, ...(updates.softSkills || {}) },
        designPhilosophy: {
          ...(current.designPhilosophy || {}),
          ...(updates.designPhilosophy || {}),
        } as DesignPhilosophy,

        // OS Configuration
        desktopPreferences: mergeDesktopPreferences(
          current.desktopPreferences,
          updates.desktopPreferences
        ),
        wallpaperConfig: {
          ...current.wallpaperConfig,
          ...(updates.wallpaperConfig || {}),
        } as WallpaperConfig,
        dockConfig: { ...current.dockConfig, ...(updates.dockConfig || {}) } as DockPreferences,

        windowPreferences: mergeWindowPreferences(
          current.windowPreferences,
          updates.windowPreferences
        ),
        soundConfig: { ...current.soundConfig, ...(updates.soundConfig || {}) } as SoundConfig,
        labels: { ...(current.labels || {}), ...(updates.labels || {}) } as AboutData['labels'],

        lastUpdated: new Date().toISOString(),
      };

      const oldAssets = extractAboutAssets(current);
      const newAssets = extractAboutAssets(mergedData);
      const orphanedAssets = oldAssets.filter((url) => !newAssets.includes(url));

      const success = await service.saveData(mergedData, 'Update about page content');
      if (!success) {
        throw new Error('ContentService failed to save data');
      }

      // Cleanup storage asynchronously (fire and forget to not block UI response)
      if (orphanedAssets.length > 0) {
        deleteStorageAssets(orphanedAssets, 'AboutService').catch((e) =>
          console.warn('[AboutService] Failed to clean up orphaned assets:', e)
        );
      }

      return mergedData;
    } catch (error) {
      console.error('[AboutService] Update failed:', error);
      throw error;
    }
  },
};
