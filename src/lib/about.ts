import { aboutService } from '@/lib/services/aboutService';
import type { AboutData, AboutHero, AboutProfessional, AboutSoftSkills, DesignPhilosophy, WallpaperConfig, DockPreferences, SoundConfig, WindowPreferences, AboutIslandNotification } from '@/types/about';

// Use cached data by default for performance
// Cache is invalidated explicitly when admin updates data
export async function loadAboutData(): Promise<AboutData | null> {
  try {
    const data = await aboutService.getAboutData();
    return data;
  } catch (error) {
    console.error('Error loading about data:', error);
    return null;
  }
}

// Invalidate cache when admin updates about data
export function invalidateAboutCache(): void {
  // Force next read to bypass cache
  aboutService.getAboutData(true).catch(() => {});
}

// ===== SECTION-SPECIFIC LOADERS =====

export async function loadHeroData(): Promise<AboutHero | null> {
  const data = await loadAboutData();
  return data?.hero || null;
}

export async function loadProfessionalData(): Promise<AboutProfessional | null> {
  const data = await loadAboutData();
  return data?.professional || null;
}

export async function loadSoftSkillsData(): Promise<AboutSoftSkills | null> {
  const data = await loadAboutData();
  return data?.softSkills || null;
}

export async function loadDesignPhilosophy(): Promise<DesignPhilosophy | null> {
  const data = await loadAboutData();
  return data?.designPhilosophy || null;
}

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
