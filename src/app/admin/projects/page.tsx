import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import AdminProjectsClient from './AdminProjectsClient';
import AdminLayout from '../components/AdminLayout';
import { FolderKanban } from 'lucide-react';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Admin - Projects Management',
  description: 'Manage portfolio projects',
  path: '/admin/projects'
});

export default function AdminProjectsPage() {
  return (
    <AdminLayout
      title="Projects Management"
      subtitle="Kelola proyek portofolio"
      breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Projects' }]}
      titleIcon={<FolderKanban className="h-5 w-5" aria-hidden />}
      titleAccent="bg-purple-50 text-purple-700"
    >
      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading projects data...</div>}>
        <AdminProjectsClient />
      </Suspense>
    </AdminLayout>
  );
}
