import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminExperienceClient from './AdminExperienceClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - Experience Management',
  description: 'Manage experience statistics and work history',
  path: '/admin/experience',
});

export default function AdminExperiencePage() {
  return <AdminExperienceClient />;
}

