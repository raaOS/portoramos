import React from 'react';
import { loadHomepageData } from '@/lib/loaders';
import HomeOSWrapper from '@/components/home/HomeOSWrapper';

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

export default async function Home() {
  // Single consolidated fetch call
  const { aboutData, experienceData, hardSkillsData, projects, testimonialsData } =
    await loadHomepageData();

  // Wallpaper LCP: tidak pakai react-dom `preload()` di sini.
  //
  // Manual preload mentah URL (mis. /wallpapers/foo.webp) justru jadi
  // double-fetch bug — `next/image priority` di DesktopSkeleton minta versi
  // optimized lewat /_next/image?url=...&w=...&q=..., URL yang berbeda dari
  // yang di-preload, sehingga browser download dua kali. `priority` Next/Image
  // sudah otomatis emit <link rel="preload"> dengan URL optimized yang benar
  // (lihat src/components/os/ui/DesktopSkeleton.tsx).

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
