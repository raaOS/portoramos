import { allProjectsAsync } from '@/lib/projects';
import { getContactData } from '@/lib/contact';
import ContactClient from './ContactClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Ramos Portfolio',
  description: 'Get in touch for collaborations and projects.',
};

// [STICKY NOTE] CONTACT PAGE - SERVER COMPONENT
// Halaman Kontak ini dijalankan di Server.
// Fungsinya:
// 1. Mengambil data proyek (untuk background) dan data kontak dari CMS/File.
// 2. Mengirim data tersebut ke Client Component (ContactClient).

// [STICKY NOTE] REVALIDATE = 60
// Halaman ini di-build ulang di server setiap 60 detik.
// Perubahan konten di Admin Panel akan terlihat setelah satu menit.
export const revalidate = 60;

export default async function ContactPage() {
  // Parallel fetching for speed
  const [projects, contactData] = await Promise.all([
    allProjectsAsync(),
    getContactData()
  ]);

  // Filter valid projects just in case
  const validProjects = projects || [];

  // Format contact info
  const contactInfo = contactData ? {
    email: contactData.info.email,
    socialMedia: contactData.info.socialMedia,
    headline: contactData.content?.headline,
    subtext: contactData.content?.subtext
  } : undefined;

  return (
    <ContactClient
      projects={validProjects}
      contactInfo={contactInfo}
    />
  );
}
