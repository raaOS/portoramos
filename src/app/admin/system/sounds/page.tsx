'use client';

import { Music } from 'lucide-react';
import { AdminAuthGuard } from '../../components/AdminAuthGuard';
import { AdminHeader } from '../../components/components/AdminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminSystem } from '../../hooks/useAdminSystem';
import SoundEffectsManager from '../components/SoundEffectsManager';
import AdminLoading from '@/components/admin/AdminLoading';

function SoundsClientContent() {
  const { csrfToken } = useAdminAuth();
  const { systemData, loading, error, handleUpdateSystem } = useAdminSystem(csrfToken);

  if (loading && !systemData) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <AdminLoading size="default" />
      </div>
    );
  }

  if (!systemData) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-red-600">Gagal memuat data efek suara.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Efek Suara OS"
        titleIcon={<Music className="h-5 w-5" aria-hidden />}
        titleAccent="bg-amber-50 text-amber-700"
      />

      <div className="flex-1 space-y-6 p-6">
        {error && (
          <div className="mb-6 flex items-center justify-between rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <span>{error}</span>
          </div>
        )}

        <div className="min-h-[500px] w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          <SoundEffectsManager
            config={systemData.soundConfig || {}}
            onUpdate={(data) => handleUpdateSystem({ soundConfig: data })}
          />
        </div>
      </div>
    </>
  );
}

export default function AdminSoundsPage() {
  return (
    <AdminAuthGuard>
      <SoundsClientContent />
    </AdminAuthGuard>
  );
}
