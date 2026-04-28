import React from 'react';
import { loadHomepageData } from '@/lib/loaders';
import HomeOSWrapper from '@/components/home/HomeOSWrapper';

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

export default async function Home() {
  // Single consolidated fetch call
  const { 
    aboutData, 
    experienceData, 
    hardSkillsData, 
    projects, 
    testimonialsData 
  } = await loadHomepageData();

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
