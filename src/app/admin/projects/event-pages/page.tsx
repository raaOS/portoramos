import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminEventPagesClient from './AdminEventPagesClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - Event Page Manager',
  description: 'Manage folder-based event landing pages',
  path: '/admin/projects/event-pages',
});

export default function AdminEventPagesPage() {
  return <AdminEventPagesClient />;
}
