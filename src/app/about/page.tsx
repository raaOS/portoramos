import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata, generateStructuredData } from '@/lib/seo';
import AboutClientWithAutoUpdate from '@/app/about/_components/AboutClientWithAutoUpdate';
import { loadAboutData } from '@/lib/about';
import { allProjectsAsync } from '@/lib/projects';

export const metadata: Metadata = generateSEOMetadata({
  title: 'About Ramos',
  description: 'Profil Ramos sebagai desainer digital: latar belakang, cara kerja, nilai yang dipegang, dan pendekatan dalam membangun pengalaman visual yang konsisten.',
  path: '/about'
});

// Cache server-rendered about page (Static by default, revalidated via Webhook)
export const revalidate = 60;

export default async function AboutPage() {
  const [aboutData, projects] = await Promise.all([
    loadAboutData(),
    allProjectsAsync()
  ]);

  const personJsonLd = generateStructuredData('person');

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <AboutClientWithAutoUpdate
        initialAboutData={aboutData ?? undefined}
        initialProjects={projects}
      />
    </div>
  );
}
