import React from 'react';
import ReactDOM from 'react-dom';
import { loadHomepageData } from '@/lib/loaders';
import HomeOSWrapper from '@/components/home/HomeOSWrapper';
import { DEFAULT_WALLPAPER_URL } from '@/components/os/utils/zIndexLayers';

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

export default async function Home() {
  // Single consolidated fetch call
  const {
    aboutData,
    experienceData,
    hardSkillsData,
    projects,
    testimonialsData,
  } = await loadHomepageData();

  // LCP optimization: tell the browser to fetch the active wallpaper as early
  // as possible — before HTML stream finishes — so the bitmap is ready when
  // <Image> mounts inside DesktopSkeleton/DesktopBackground.
  const cfg = aboutData?.wallpaperConfig;
  const resolvedWallpaper = cfg?.activeWallpaperId
    ? cfg.collection?.find((w) => w.id === cfg.activeWallpaperId)?.url
    : undefined;
  const wallpaper = resolvedWallpaper && (resolvedWallpaper.startsWith('/') || resolvedWallpaper.startsWith('http'))
    ? resolvedWallpaper
    : DEFAULT_WALLPAPER_URL;
  const isVideoWallpaper = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(wallpaper) || wallpaper.startsWith('data:video');

  if (!isVideoWallpaper) {
    ReactDOM.preload(wallpaper, {
      as: 'image',
      fetchPriority: 'high',
    });
  }

  return (
    <div className="h-screen w-full bg-[#050505] overflow-hidden relative">
      <HomeOSWrapper
        aboutData={aboutData}
        experienceData={experienceData}
        hardSkillsData={hardSkillsData}
        projects={projects}
        testimonialsData={testimonialsData}
      />
    </div>
  );
}
