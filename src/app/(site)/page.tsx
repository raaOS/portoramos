import React from 'react';
import { preload } from 'react-dom';
import { loadHomepageData } from '@/lib/loaders';
import HomeOSWrapper from '@/components/home/HomeOSWrapper';
import { isVideoSource } from '@/lib/mediaPreview';

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

export default async function Home() {
  const { aboutData, experienceData, hardSkillsData, projects, testimonialsData } =
    await loadHomepageData();

  const wallpaperConfig = aboutData?.wallpaperConfig;
  if (wallpaperConfig?.collection?.length) {
    const activeEntry = wallpaperConfig.activeWallpaperId
      ? wallpaperConfig.collection.find((w) => w.id === wallpaperConfig.activeWallpaperId)
      : wallpaperConfig.collection[0];
    const rawUrl = activeEntry?.url;
    if (rawUrl && (rawUrl.startsWith('/') || rawUrl.startsWith('http'))) {
      const posterUrl = isVideoSource(rawUrl)
        ? activeEntry.posterUrl || rawUrl
        : rawUrl;
      if (posterUrl) {
        preload(posterUrl, { as: 'image', fetchPriority: 'high' });
      }
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#050505]">
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
