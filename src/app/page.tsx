import DesktopEnvironment from '@/app/about/_components/os/core/DesktopEnvironmentClient';
import { loadAboutData } from '@/lib/about';
import { loadExperienceData } from '@/lib/experience';
import { loadHardSkillsData } from '@/lib/hardSkills';
import { allProjectsAsync } from '@/lib/projects';
import { headers } from 'next/headers';

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

export default async function Home() {
  const headerStore = await headers();
  
  const referer = headerStore.get('referer');
  const host = headerStore.get('host');
  
  // Skip boot only if navigating from our own site (internal link)
  // This allows new tabs (no referer) to show the boot animation
  const isInternalNavigation = !!(referer && host && referer.includes(host));
  const hasBooted = isInternalNavigation;

  // Parallel data fetching for faster TTFB
  const [aboutData, experienceData, hardSkillsData, allProjects] = await Promise.all([
    loadAboutData(),
    loadExperienceData(),
    loadHardSkillsData(),
    allProjectsAsync()
  ]);

  const projects = (allProjects || []).filter(p => p.status !== 'draft');

  return (
    <div className="h-screen w-full bg-[#050505] overflow-hidden relative">
      <DesktopEnvironment
        aboutData={aboutData}
        experienceData={experienceData}
        hardSkillsData={hardSkillsData}
        projects={projects}
        initialHasBooted={hasBooted}
      />
    </div>
  );
}
