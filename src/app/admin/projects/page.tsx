import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminProjectsClient from './AdminProjectsClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - Projects Management',
  description: 'Manage portfolio projects',
  path: '/admin/projects'
});

export default function AdminProjectsPage() {
  return <AdminProjectsClient />;
}
