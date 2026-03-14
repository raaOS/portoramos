import DesktopEnvironment from '@/app/about/_components/os/core/DesktopEnvironmentClient';
import { loadAboutData } from '@/lib/about';
import { loadExperienceData } from '@/lib/experience';
import { loadHardSkillsData } from '@/lib/hardSkills';
import { allProjectsAsync } from '@/lib/projects';
import { cookies, headers } from 'next/headers';

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

export default async function Home() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  
  const hasBootedCookie = cookieStore.get('ramos_os_booted')?.value === 'true';
  const referer = headerStore.get('referer');
  const host = headerStore.get('host');
  
  // Skip boot if cookie exists OR if navigating from our own site (internal link)
  const isInternalNavigation = !!(referer && host && referer.includes(host));
  const hasBooted = !!(hasBootedCookie || isInternalNavigation);

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
