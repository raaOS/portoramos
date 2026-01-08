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

// [STICKY NOTE] ABOUT PAGE - SERVER COMPONENT
// Ini adalah halaman utama "About" yang dijalankan di Server (bukan di browser user).
// Fungsinya:
// 1. Mengambil data awal (projects & about data) dari database/file saat "Build Time".
// 2. Menyiapkan SEO (Metadata) agar mudah ditemukan Google.
// 3. Mengirim data matang ke "Client Component" agar browser user tinggal tampilkan saja.

// [STICKY NOTE] REVALIDATE = 60
// Artinya: Halaman ini akan dibuat ulang di server paling cepat setiap 60 detik.
// Jadi kalau Anda update konten di Admin, halaman public akan berubah setelah ~1 menit.
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
