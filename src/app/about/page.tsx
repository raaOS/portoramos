import DesktopEnvironment from './_components/os/DesktopEnvironment';
import { loadAboutData } from '@/lib/about';
import { loadExperienceData } from '@/lib/experience';
import { loadHardSkillsData } from '@/lib/hardSkills';
import { allProjectsAsync } from '@/lib/projects';

// Cache for 1 hour (ISR) to improve performance and prevent Vercel timeouts
export const revalidate = 3600;

export default async function AboutTestPage() {
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
