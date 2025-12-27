import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AboutClientWithAutoUpdate from '@/app/about/_components/AboutClientWithAutoUpdate';
import { loadAboutData } from '@/lib/about';
import { allProjectsAsync } from '@/lib/projects';

export const metadata: Metadata = generateSEOMetadata({
  title: 'About Ramos',
  description: 'Profil Ramos sebagai desainer digital: latar belakang, cara kerja, nilai yang dipegang, dan pendekatan dalam membangun pengalaman visual yang konsisten.',
  path: '/about'
});

// Set revalidate to 0 for real-time updates (SSR)
export const revalidate = 0;

export default async function AboutPage() {
  const [aboutData, projects] = await Promise.all([
    loadAboutData(),
    allProjectsAsync()
  ]);

  return (
    <div>
      <AboutClientWithAutoUpdate
        initialAboutData={aboutData ?? undefined}
        initialProjects={projects}
      />
    </div>
  );
}
