import { aboutService } from '@/lib/services/aboutService';
import { createCachedFetcher, invalidateCache } from '@/lib/cache';
import type { AboutData, AboutHero, AboutProfessional, AboutSoftSkills, DesignPhilosophy, WallpaperConfig, DockPreferences, SoundConfig, WindowPreferences, AboutIslandNotification } from '@/types/about';

const ABOUT_CACHE_KEY = 'about-data';

// Cached fetcher untuk deduplication
// NOTE: TTL dikurangi ke 5 detik karena about data sering berubah (positions, windows)
const cachedAboutFetcher = createCachedFetcher<AboutData>(
  ABOUT_CACHE_KEY,
  async () => {
    // ContentService sudah handle cache 5 detik, tapi tetap force noCache untuk fresh
    const data = await aboutService.getAboutData(true); // noCache = true untuk fresh data
    return data;
  },
  5_000 // 5 seconds cache (cepat update untuk positions/windows)
);

/**
 * Load about data with caching
 * Uses React.cache for request deduplication
 * Cache hanya 5 detik karena positions/windows sering berubah
 */
export async function loadAboutData(): Promise<AboutData | null> {
  try {
    return await cachedAboutFetcher();
  } catch (error) {
    console.error('Error loading about data:', error);
    return null;
  }
}

/**
 * Invalidate about cache (call after updates)
 */
export function invalidateAboutCache(): void {
  invalidateCache(ABOUT_CACHE_KEY);
}

// ===== SECTION-SPECIFIC LOADERS (For granular loading) =====

/**
 * Load only hero section (lightweight)
 */
export async function loadHeroData(): Promise<AboutHero | null> {
  const data = await loadAboutData();
  return data?.hero || null;
}

/**
 * Load only professional/contacts section
 */
export async function loadProfessionalData(): Promise<AboutProfessional | null> {
  const data = await loadAboutData();
  return data?.professional || null;
}

/**
 * Load only soft skills
 */
export async function loadSoftSkillsData(): Promise<AboutSoftSkills | null> {
  const data = await loadAboutData();
  return data?.softSkills || null;
}

/**
 * Load only design philosophy
 */
export async function loadDesignPhilosophy(): Promise<DesignPhilosophy | null> {
  const data = await loadAboutData();
  return data?.designPhilosophy || null;
}

/**
 * Load OS configuration (wallpaper, dock, sounds)
 */
export async function loadOSConfig(): Promise<{
  wallpaperConfig?: WallpaperConfig;
  dockConfig?: DockPreferences;
  soundConfig?: SoundConfig;
  windowPreferences?: WindowPreferences;
  notifications?: AboutIslandNotification[];
} | null> {
  const data = await loadAboutData();
  if (!data) return null;
  
  return {
    wallpaperConfig: data.wallpaperConfig,
    dockConfig: data.dockConfig,
    soundConfig: data.soundConfig,
    windowPreferences: data.windowPreferences,
    notifications: data.islandNotifications,
  };
}
