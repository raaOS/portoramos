import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminLeadsClient from './AdminLeadsClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - Leads & Messages',
  description: 'Manage messages from contact forms',
  path: '/admin/leads'
});

export default function AdminLeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading leads data...</div>}>
      <AdminLeadsClient />
    </Suspense>
  );
}
