'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminSystem } from '@/app/admin/hooks/useAdminSystem';
import SoundEffectsManager from '@/app/admin/system/components/SoundEffectsManager';
import AdminLoading from '@/components/admin/AdminLoading';

export default function SoundsPanel() {
  const { csrfToken } = useAdminAuth();
  const { systemData, loading, error, handleUpdateSystem } = useAdminSystem(csrfToken);

  if (loading && !systemData) return <AdminLoading size="default" />;

  if (!systemData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-600">Gagal memuat data efek suara.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      <div className="min-h-[400px] w-full rounded-lg border border-gray-200 bg-white p-6">
        <SoundEffectsManager
          config={systemData.soundConfig || {}}
          onUpdate={(data) => handleUpdateSystem({ soundConfig: data })}
        />
      </div>
    </div>
  );
}
