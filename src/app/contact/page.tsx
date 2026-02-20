import { getContactData } from '@/lib/contact';
import { loadAboutData } from '@/lib/about';
import FullPageChat from './FullPageChat';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Ramos Portfolio',
  description: 'Get in touch for collaborations and projects.',
};

// [STICKY NOTE] CONTACT PAGE - SERVER COMPONENT
// Halaman Kontak ini dijalankan di Server.
// Fungsinya:
// 1. Mengambil data kontak dari CMS/File.
// 2. Mengirim data tersebut ke Client Component (FullPageChat).

// Disable caching for Contact page to ensure immediate dock/content updates
export const revalidate = 0;

export default async function ContactPage() {
  const [contactData, aboutData] = await Promise.all([
    getContactData(),
    loadAboutData()
  ]);

  // Format contact info
  const contactInfo = contactData ? {
    email: contactData.info.email,
    socialMedia: contactData.info.socialMedia,
    headline: contactData.content?.headline,
    subtext: contactData.content?.subtext
  } : undefined;

  return (
    <>
      <FullPageChat contactInfo={contactInfo} />
    </>
  );
}
