import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminContactClient from '@/app/admin/communications/contacts/AdminContactClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - Contacts Management',
  description: 'Manage client contact links and social media accounts',
  path: '/admin/communications/contacts',
});

export default function AdminContactsPage() {
  return (
    <Suspense fallback={null}>
      <AdminContactClient />
    </Suspense>
  );
}
