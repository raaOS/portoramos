'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminContent } from '@/app/admin/hooks/useAdminContent';
import LabelsManager from '@/app/admin/content/components/LabelsManager';
import AdminLoading from '@/components/admin/AdminLoading';

export default function LabelsPanel() {
  const { csrfToken } = useAdminAuth();
  const { labels, labelsLoading, error, handleUpdateLabels } =
    useAdminContent(csrfToken);

  if (labelsLoading && labels.length === 0) return <AdminLoading size="default" />;

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      <div className="min-h-[400px] w-full rounded-lg border border-gray-200 bg-white p-6">
        <LabelsManager
          initialLabels={labels}
          onUpdate={handleUpdateLabels}
          loading={labelsLoading}
        />
      </div>
    </div>
  );
}
