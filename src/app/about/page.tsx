import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AboutClientWithAutoUpdate from '@/components/AboutClientWithAutoUpdate';
import { loadAboutData } from '@/lib/about';

export const metadata: Metadata = generateSEOMetadata({
  title: 'About Ramos',
  description: 'Profil Ramos sebagai desainer digital: latar belakang, cara kerja, nilai yang dipegang, dan pendekatan dalam membangun pengalaman visual yang konsisten.',
  path: '/about'
});

// Set revalidate to 0 for real-time updates (SSR)
export const revalidate = 0;

export default async function AboutPage() {
  const aboutData = await loadAboutData();

  return (
    <div>
      <AboutClientWithAutoUpdate
        initialAboutData={aboutData ?? undefined}
      />
    </div>
  );
}
