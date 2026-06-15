import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminLeadsClient from '@/app/admin/communications/messages/AdminLeadsClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - Messages Management',
  description: 'Manage incoming client messages',
  path: '/admin/communications/messages',
});

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={null}>
      <AdminLeadsClient />
    </Suspense>
  );
}
