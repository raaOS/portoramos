'use client';

import { useSearchParams } from 'next/navigation';
import { Info, Monitor, Info as InfoIcon, X, Image as ImageIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

// Design system & hooks
import { AdminHeader } from '../components/components/AdminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// New Modular Hooks & Components
import { useAdminAbout } from '../hooks/useAdminAbout';
import ProfessionalSectionForm from './components/ProfessionalSectionForm';
import SoftSkillsSectionForm from './components/SoftSkillsSectionForm';

// Existing Modular Components
import RunningTextPanel from './components/RunningTextPanel';
import WallpaperManager from './components/WallpaperManager';
import DesktopProjectsForm from './components/DesktopProjectsForm';
import DockConfigForm from './components/DockConfigForm';
import StickyNotesManager from './components/StickyNotesManager';
import NotificationsManager from './components/NotificationsManager';
import HardSkillsManager from './components/HardSkillsManager';
import SoundEffectsManager from './components/SoundEffectsManager';

import LabelsManager from './components/LabelsManager';
import AdminLoading from '@/components/admin/AdminLoading';

// Lazy load heavy third-party components
const DesignPhilosophyForm = dynamic(() => import('@/components/admin/about/DesignPhilosophyForm'));
const GalleryManager = dynamic(() => import('@/components/admin/GalleryManager'), {
  loading: () => <AdminLoading size="default" />,
});

export default function AdminAboutClient() {
  const { csrfToken } = useAdminAuth();
  const searchParams = useSearchParams();

  // Derive active tab from URL search parameters (Source of Truth)
  const tabParam = searchParams.get('tab');
  const validTabs = [
    'professional',
    'softSkills',
    'hardSkills',
    'labels',
    'runningText',
    'philosophy',
    'desktop',
    'wallpaper',
    'dock',
    'stickyNotes',
    'notifications',
    'sounds',
    'archive',
  ];
  type ValidTab =
    | 'professional'
    | 'softSkills'
    | 'hardSkills'
    | 'labels'
    | 'runningText'
    | 'philosophy'
    | 'desktop'
    | 'wallpaper'
    | 'dock'
    | 'stickyNotes'
    | 'notifications'
    | 'sounds'
    | 'archive';

  const activeTab =
    tabParam && validTabs.includes(tabParam) ? (tabParam as ValidTab) : 'professional';

  // Custom Hook for Data management
  const {
    aboutData,
    isPlaceholderData: aboutIsPlaceholder,
    loading,
    error,
    projects,
    runningTexts,
    runningTextsLoading,
    labels,
    labelsLoading,
    handleUpdateAbout,
    handleUpdateLabels,
    handleCreateRunningText,
    handleUpdateRunningText,
    handleDeleteRunningText,
  } = useAdminAbout(csrfToken);

  const { isAdmin, isLoading: authLoading } = useAdminAuth();

  if (authLoading || (loading && !aboutData)) {
    return (
      <>
        <AdminHeader
          title="Kelola Konten About"
          titleIcon={<Info className="h-5 w-5" aria-hidden />}
          titleAccent="bg-blue-50 text-blue-700"
        />
        <div className="flex-1 space-y-6 p-6">
          <AdminLoading size="default" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <AdminHeader
          title="Unauthorized"
          titleIcon={<X className="h-5 w-5" aria-hidden />}
          titleAccent="bg-red-50 text-red-700"
        />
        <div className="flex-1 space-y-6 p-6">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <InfoIcon className="mb-4 h-16 w-16 text-yellow-500" />
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Akses Terbatas</h2>
            <p className="mb-6 text-gray-600">Sesi Anda telah berakhir atau Anda belum masuk.</p>
            <a
              href="/admin/login"
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Masuk Sekarang
            </a>
          </div>
        </div>
      </>
    );
  }

  if (!aboutData) {
    return (
      <>
        <AdminHeader
          title="Kelola Konten About"
          titleIcon={<Info className="h-5 w-5" aria-hidden />}
          titleAccent="bg-blue-50 text-blue-700"
        />
        <div className="flex-1 space-y-6 p-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-red-600">Gagal memuat data about</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Kelola Konten About" />
      <div className="flex-1 space-y-6 p-6">
        {error && (
          <div className="mb-6 flex items-center justify-between rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <span>{error}</span>
          </div>
        )}

        <div className="min-h-[500px] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-white">
            <div className="p-6 lg:p-8">
              {activeTab === 'professional' && (
                <ProfessionalSectionForm
                  data={aboutData.professional}
                  heroData={aboutData.hero}
                  projects={projects}
                  onUpdate={handleUpdateAbout}
                />
              )}

              {activeTab === 'softSkills' && (
                <SoftSkillsSectionForm
                  data={aboutData.softSkills}
                  onUpdate={(data) => handleUpdateAbout({ softSkills: data })}
                />
              )}

              {activeTab === 'hardSkills' && (
                <div className="space-y-8">
                  <HardSkillsManager />
                </div>
              )}

              {activeTab === 'labels' && (
                <LabelsManager
                  initialLabels={labels}
                  onUpdate={handleUpdateLabels}
                  loading={labelsLoading}
                />
              )}

              {activeTab === 'philosophy' && <DesignPhilosophyForm />}

              {activeTab === 'runningText' && (
                <RunningTextPanel
                  items={runningTexts}
                  loading={runningTextsLoading}
                  onCreate={handleCreateRunningText}
                  onUpdate={handleUpdateRunningText}
                  onDelete={handleDeleteRunningText}
                />
              )}

              {activeTab === 'wallpaper' && (
                <div className="space-y-8">
                  <div className="mb-6 rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                    <h3 className="flex items-center gap-2 font-bold text-cyan-800">
                      <ImageIcon className="h-5 w-5" /> Konfigurasi Wallpaper & Tema
                    </h3>
                    <p className="mt-1 text-sm text-cyan-600">
                      Ganti latar belakang desktop dan atur transparansi window.
                    </p>
                  </div>
                  <WallpaperManager
                    data={aboutData.wallpaperConfig}
                    onUpdate={(data) => handleUpdateAbout({ wallpaperConfig: data })}
                    isLoading={aboutIsPlaceholder}
                  />
                </div>
              )}

              {activeTab === 'desktop' && (
                <div className="space-y-8">
                  <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h3 className="flex items-center gap-2 font-bold text-blue-800">
                      <Monitor className="h-5 w-5" /> Konfigurasi Ikon Desktop
                    </h3>
                    <p className="mt-1 text-sm text-blue-600">
                      Atur shortcut aplikasi dan file yang tampil di halaman utama.
                    </p>
                  </div>
                  <DesktopProjectsForm
                    projects={projects}
                    data={aboutData.desktopPreferences}
                    onUpdate={(data) => handleUpdateAbout({ desktopPreferences: data })}
                  />
                </div>
              )}

              {activeTab === 'dock' && (
                <div className="space-y-8">
                  <DockConfigForm
                    data={aboutData?.dockConfig || {}}
                    onUpdate={(data) => handleUpdateAbout({ dockConfig: data })}
                  />
                </div>
              )}

              {activeTab === 'stickyNotes' && (
                <div className="space-y-8">
                  <StickyNotesManager />
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <NotificationsManager
                    notifications={aboutData?.islandNotifications || []}
                    onUpdate={(data) => handleUpdateAbout({ islandNotifications: data })}
                  />
                </div>
              )}

              {activeTab === 'sounds' && (
                <div className="space-y-8">
                  <SoundEffectsManager
                    config={aboutData?.soundConfig || {}}
                    onUpdate={(data) => handleUpdateAbout({ soundConfig: data })}
                  />
                </div>
              )}

              {activeTab === 'archive' && <GalleryManager projects={projects} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
