'use client';

import dynamic from 'next/dynamic';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminContent } from '@/app/admin/hooks/useAdminContent';
import AdminLoading from '@/components/admin/AdminLoading';

const GalleryManager = dynamic(() => import('@/components/admin/GalleryManager'), {
  loading: () => <AdminLoading size="default" />,
});

export default function ArchivePanel() {
  const { csrfToken } = useAdminAuth();
  const { projects, loading, error } = useAdminContent(csrfToken);

  if (loading && projects.length === 0) return <AdminLoading size="default" />;

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      <div className="min-h-[400px] w-full rounded-lg border border-gray-200 bg-white p-6">
        <GalleryManager projects={projects} />
      </div>
    </div>
  );
}
