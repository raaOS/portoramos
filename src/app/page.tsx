import DesktopEnvironment from '@/app/about/_components/os/core/DesktopEnvironmentClient';
import { loadAboutData } from '@/lib/about';
import { loadExperienceData } from '@/lib/experience';
import { loadHardSkillsData } from '@/lib/hardSkills';
import { allProjectsAsync } from '@/lib/projects';
import { loadTestimonialsData } from '@/lib/testimonial';

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

export default async function Home() {
  // Parallel data fetching for faster TTFB
  const [aboutData, experienceData, hardSkillsData, allProjects, testimonialsData] = await Promise.all([
    loadAboutData(),
    loadExperienceData(),
    loadHardSkillsData(),
    allProjectsAsync(),
    loadTestimonialsData(),
  ]);

  const projects = (allProjects || []).filter(p => p.status !== 'draft');

  return (
    <div className="h-screen w-full bg-[#050505] overflow-hidden relative">
      <DesktopEnvironment
        aboutData={aboutData}
        experienceData={experienceData}
        hardSkillsData={hardSkillsData}
        projects={projects}
        testimonialsData={testimonialsData}
      />
    </div>
  );
}
