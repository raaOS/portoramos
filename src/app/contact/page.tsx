import { allProjectsAsync } from '@/lib/projects';
import { getContactData } from '@/lib/contact';
import ContactClient from './ContactClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Ramos Portfolio',
  description: 'Get in touch for collaborations and projects.',
};

// Force dynamic since we might want fresh data, or leave as default.
// Given strict "instant" requirement, static is better, but portfolio usually needs fresh data.
// Let's use revalidate 60 seconds (ISR) or 0 if we want strictly dynamic.
// The user has explicit "real-time" needs for projects, so let's default to dynamic or 0 revalidate.
export const revalidate = 0;

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
    headline: contactData.content.headline,
    subtext: contactData.content.subtext
  } : undefined;

  return (
    <ContactClient
      projects={validProjects}
      contactInfo={contactInfo}
    />
  );
}
