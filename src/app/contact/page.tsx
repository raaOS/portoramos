import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import ContactClientWithAutoUpdate from '@/components/ContactClientWithAutoUpdate';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Contact',
  description: 'Hubungi Ramos untuk kolaborasi, project desain baru, atau pertanyaan seputar karya dan proses kreatif.',
  path: '/contact'
});

// Konten contact jarang berubah, cukup revalidate per jam
export const revalidate = 3600;

export default function ContactPage() {
  return <ContactClientWithAutoUpdate />;
}
