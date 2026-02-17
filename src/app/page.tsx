import DesktopEnvironment from '@/app/about/_components/os/DesktopEnvironment';
import { loadAboutData } from '@/lib/about';
import { loadExperienceData } from '@/lib/experience';
import { loadHardSkillsData } from '@/lib/hardSkills';
import { allProjectsAsync } from '@/lib/projects';

// Disable caching for homepage to ensure admin updates (dock icons, etc.) show immediately
export const revalidate = 0;

export default async function Home() {
  const [aboutData, experienceData, hardSkillsData, allProjects] = await Promise.all([
    loadAboutData(),
    loadExperienceData(),
    loadHardSkillsData(),
    allProjectsAsync()
  ]);

  const projects = (allProjects || []).filter(p => p.status !== 'draft');

  return (
    <main className="h-screen w-full bg-[#050505] overflow-hidden">
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
