'use client';

import { Tag } from 'lucide-react';
import { AdminAuthGuard } from '../../components/AdminAuthGuard';
import { AdminHeader } from '../../components/components/AdminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminContent } from '../../hooks/useAdminContent';
import LabelsManager from '../components/LabelsManager';
import AdminLoading from '@/components/admin/AdminLoading';

function LabelsClientContent() {
  const { csrfToken } = useAdminAuth();
  const { labels, labelsLoading, error, handleUpdateLabels } = useAdminContent(csrfToken);

  if (labelsLoading && labels.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <AdminLoading size="default" />
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Kelola Labels & Tag"
        titleIcon={<Tag className="h-5 w-5" aria-hidden />}
        titleAccent="bg-gray-50 text-gray-700"
      />

      <div className="flex-1 space-y-6 p-6">
        {error && (
          <div className="mb-6 flex items-center justify-between rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <span>{error}</span>
          </div>
        )}

        <div className="min-h-[500px] w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          <LabelsManager
            initialLabels={labels}
            onUpdate={handleUpdateLabels}
            loading={labelsLoading}
          />
        </div>
      </div>
    </>
  );
}

export default function AdminLabelsPage() {
  return (
    <AdminAuthGuard>
      <LabelsClientContent />
    </AdminAuthGuard>
  );
}
