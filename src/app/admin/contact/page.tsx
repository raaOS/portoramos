import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminContactClient from './AdminContactClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - Contact Management',
  description: 'Manage contact page content and form settings',
  path: '/admin/contact'
});

export default function AdminContactPage() {
  return <AdminContactClient />;
}
