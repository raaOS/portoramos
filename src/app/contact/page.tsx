import { allProjectsAsync } from '@/lib/projects';
import { getContactData } from '@/lib/contact';
import ContactClient from './ContactClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Ramos Portfolio',
  description: 'Get in touch for collaborations and projects.',
};

// Cache server-rendered contact page (Static by default, revalidated via Webhook)
// export const revalidate = 0;

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
