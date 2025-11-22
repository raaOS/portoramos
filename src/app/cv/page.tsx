import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import CvPageClient from '@/components/CvPageClient';
import { loadAboutData } from '@/lib/about';
import { loadExperienceData } from '@/lib/experience';
import { allProjectsAsync } from '@/lib/projects';

export const metadata: Metadata = generateSEOMetadata({
  title: 'CV | Ramos',
  description: 'CV versi ATS-friendly untuk screening cepat: ringkasan, skills, pengalaman, dan proyek utama.',
  path: '/cv'
});

// Selalu render dinamis agar data CV mengikuti perubahan data portofolio terbaru
export const revalidate = 0;

export default async function CvPage() {
  const [aboutData, experienceData, projects] = await Promise.all([
    loadAboutData(),
    loadExperienceData(),
    allProjectsAsync()
  ]);

  return (
    <CvPageClient
      aboutData={aboutData}
      experienceData={experienceData}
      projects={projects}
    />
  );
}
