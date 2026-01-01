import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import CvPageClient from '@/app/cv/_components/CvPageClient';
import { loadAboutData } from '@/lib/about';
import { loadExperienceData } from '@/lib/experience';
import { allProjectsAsync } from '@/lib/projects';
import { loadHardSkillsData } from '@/lib/hardSkills';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Resume | Ramos',
  description: 'Resume versi ATS-friendly untuk screening cepat: ringkasan, skills, pengalaman, dan proyek utama.',
  path: '/cv'
});

// Selalu render dinamis agar data CV mengikuti perubahan data portofolio terbaru
export const revalidate = 0;

export default async function CvPage() {
  const [aboutData, experienceData, projects, hardSkillsData] = await Promise.all([
    loadAboutData(),
    loadExperienceData(),
    allProjectsAsync(),
    loadHardSkillsData()
  ]);

  return (
    <CvPageClient
      aboutData={aboutData}
      experienceData={experienceData}
      projects={projects}
      hardSkillsData={hardSkillsData}
    />
  );
}
