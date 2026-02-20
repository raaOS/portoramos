import DesktopEnvironment from '@/app/about/_components/os/DesktopEnvironmentClient';
import { loadAboutData } from '@/lib/about';
import { loadExperienceData } from '@/lib/experience';
import { loadHardSkillsData } from '@/lib/hardSkills';
import { allProjectsAsync } from '@/lib/projects';

// ISR: Revalidate homepage every 60 seconds for admin updates (dock icons, etc.)
export const revalidate = 60;

export default async function Home() {
  const [aboutData, experienceData, hardSkillsData, allProjects] = await Promise.all([
    loadAboutData(),
    loadExperienceData(),
    loadHardSkillsData(),
    allProjectsAsync()
  ]);

  const projects = (allProjects || []).filter(p => p.status !== 'draft');

  return (
    <main id="main-content" className="h-screen w-full bg-[#050505] overflow-hidden">
      <DesktopEnvironment
        aboutData={aboutData}
        experienceData={experienceData}
        hardSkillsData={hardSkillsData}
        projects={projects}
      >
      </DesktopEnvironment>
    </main>
  );
}
