import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminAboutClient from './AdminAboutClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - About Management',
  description: 'Manage about page content',
  path: '/admin/about'
});

export default function AdminAboutPage() {
  return <AdminAboutClient />;
}
