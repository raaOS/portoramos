import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import ContactClientWithAutoUpdate from '@/components/ContactClientWithAutoUpdate';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Contact',
  description: 'Hubungi Ramos untuk kolaborasi, project desain baru, atau pertanyaan seputar karya dan proses kreatif.',
  path: '/contact'
});

import { getContactData } from '@/lib/contact';

// Set revalidate to 0 for real-time updates (SSR)
export const revalidate = 0;

export default async function ContactPage() {
  const data = await getContactData();

  return (
    <div className="pt-20">
      <ContactClientWithAutoUpdate initialData={data} />
    </div>
  );
}
