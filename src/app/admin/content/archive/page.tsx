'use client';

import dynamic from 'next/dynamic';
import { Archive } from 'lucide-react';
import { AdminAuthGuard } from '../../components/AdminAuthGuard';
import { AdminHeader } from '../../components/components/AdminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminContent } from '../../hooks/useAdminContent';
import AdminLoading from '@/components/admin/AdminLoading';

const GalleryManager = dynamic(() => import('@/components/admin/GalleryManager'), {
  loading: () => <AdminLoading size="default" />,
});

function ArchiveClientContent() {
  const { csrfToken } = useAdminAuth();
  const { projects, loading, error } = useAdminContent(csrfToken);

  if (loading && projects.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <AdminLoading size="default" />
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Kelola Arsip (Gallery)"
        titleIcon={<Archive className="h-5 w-5" aria-hidden />}
        titleAccent="bg-indigo-50 text-indigo-700"
      />

      <div className="flex-1 space-y-6 p-6">
        {error && (
          <div className="mb-6 flex items-center justify-between rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <span>{error}</span>
          </div>
        )}

        <div className="min-h-[500px] w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          <GalleryManager projects={projects} />
        </div>
      </div>
    </>
  );
}

export default function AdminArchivePage() {
  return (
    <AdminAuthGuard>
      <ArchiveClientContent />
    </AdminAuthGuard>
  );
}
