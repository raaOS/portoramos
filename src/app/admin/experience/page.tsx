import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminExperienceClient from './AdminExperienceClient';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - Experience Management',
  description: 'Manage professional experience and skills',
  path: '/admin/experience',
});

export default function AdminExperiencePage() {
  return (
    <Suspense fallback={null}>
      <AdminExperienceClient />
    </Suspense>
  );
}
