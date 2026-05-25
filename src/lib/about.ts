import { aboutService, getCachedAboutData } from '@/lib/services/aboutService';
import type {
  AboutData,
  AboutHero,
  AboutProfessional,
  AboutSoftSkills,
  DesignPhilosophy,
  WallpaperConfig,
  DockPreferences,
  SoundConfig,
  WindowPreferences,
  AboutIslandNotification,
} from '@/types/about';

// Use cached data by default for performance.
// `getCachedAboutData` dibungkus React cache() untuk per-request dedup.
// Cache is invalidated explicitly when admin updates data.
export async function loadAboutData(): Promise<AboutData | null> {
  try {
    return await getCachedAboutData();
  } catch (error) {
    console.error('Error loading about data:', error);
    return null;
  }
}

// Invalidate cache when admin updates about data.
// Catatan: React cache() di getCachedAboutData hanya hidup selama satu request,
// jadi panggilan dari request berikutnya otomatis baca dari ContentService cache
// (atau D1 kalau cache 5s sudah expire). invalidateAboutCache di bawah memaksa
// bypass ContentService cache supaya admin update langsung kelihatan.
export function invalidateAboutCache(): void {
  // Force next read to bypass ContentService cache.
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
