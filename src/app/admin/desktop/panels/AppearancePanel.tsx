'use client';

import { useState } from 'react';
import { Image as ImageIcon, Monitor } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminSystem } from '@/app/admin/hooks/useAdminSystem';
import { useAdminContent } from '@/app/admin/hooks/useAdminContent';
import WallpaperManager from '@/app/admin/system/components/WallpaperManager';
import DesktopProjectsForm from '@/app/admin/system/components/DesktopProjectsForm';
import AdminLoading from '@/components/admin/AdminLoading';

export default function AppearancePanel() {
  const { csrfToken } = useAdminAuth();
  const { systemData, loading, error, isPlaceholderData, handleUpdateSystem } =
    useAdminSystem(csrfToken);
  const { projects } = useAdminContent(csrfToken);

  const [activeSubTab, setActiveSubTab] = useState<'wallpaper' | 'desktop'>('wallpaper');

  if (loading && !systemData) return <AdminLoading size="default" />;

  if (!systemData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-600">Gagal memuat data sistem.</p>
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

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('wallpaper')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
            activeSubTab === 'wallpaper'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Wallpaper & Tema
        </button>
        <button
          onClick={() => setActiveSubTab('desktop')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
            activeSubTab === 'desktop'
              ? 'border-cyan-600 text-cyan-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <Monitor className="h-4 w-4" />
          Ikon Desktop
        </button>
      </div>

      <div className="min-h-[400px] w-full rounded-lg border border-gray-200 bg-white p-6">
        {activeSubTab === 'wallpaper' ? (
          <WallpaperManager
            data={systemData.wallpaperConfig}
            onUpdate={(data) => handleUpdateSystem({ wallpaperConfig: data })}
            isLoading={isPlaceholderData}
          />
        ) : (
          <DesktopProjectsForm
            projects={projects}
            data={systemData.desktopPreferences}
            onUpdate={(data) => handleUpdateSystem({ desktopPreferences: data })}
          />
        )}
      </div>
    </div>
  );
}
