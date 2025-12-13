import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AboutClientWithAutoUpdate from '@/components/AboutClientWithAutoUpdate';
import { loadAboutData } from '@/lib/about';

export const metadata: Metadata = generateSEOMetadata({
  title: 'About Ramos',
  description: 'Profil Ramos sebagai desainer digital: latar belakang, cara kerja, nilai yang dipegang, dan pendekatan dalam membangun pengalaman visual yang konsisten.',
  path: '/about'
});

// Konten about jarang berubah, cukup revalidate per jam
export const revalidate = 3600;

export default async function AboutPage() {
  const aboutData = await loadAboutData();

  return (
    <div className="container">
      <AboutClientWithAutoUpdate
        initialAboutData={aboutData ?? undefined}
      />
    </div>
  );
}
