import React from 'react';
import { loadHomepageData } from '@/lib/loaders';
import HomeOSWrapper from '@/components/home/HomeOSWrapper';

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

export default async function Home() {
  const { aboutData, experienceData, hardSkillsData, projects, testimonialsData } =
    await loadHomepageData();

  // NOTE: manual preload of posterUrl was removed. DesktopBackground renders
  // next/image with priority, which emits its own optimized preload link
  // (/_next/image?...). Preloading the raw poster URL caused a duplicate
  // download that never matched the optimized src.

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
