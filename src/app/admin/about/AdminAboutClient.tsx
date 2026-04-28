'use client';

// React hooks - useState dan useEffect diimport untuk keperluan future use
import { useSearchParams } from 'next/navigation';
import { Info, Monitor, Info as InfoIcon, X, Image as ImageIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

// Design system & hooks
import AdminLayout from '../components/AdminLayout';
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

// Lazy load heavy third-party components
const DesignPhilosophyForm = dynamic(() => import('@/components/admin/about/DesignPhilosophyForm'));
const GalleryManager = dynamic(() => import('@/components/admin/GalleryManager'), { loading: () => <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div> });

export default function AdminAboutClient() {
  const { csrfToken } = useAdminAuth();
  const searchParams = useSearchParams();

  // Derive active tab from URL search parameters (Source of Truth)
  const tabParam = searchParams.get('tab');
  const validTabs = ['professional', 'softSkills', 'hardSkills', 'labels', 'runningText', 'philosophy', 'desktop', 'wallpaper', 'dock', 'stickyNotes', 'notifications', 'sounds', 'archive'];
  type ValidTab = 'professional' | 'softSkills' | 'hardSkills' | 'labels' | 'runningText' | 'philosophy' | 'desktop' | 'wallpaper' | 'dock' | 'stickyNotes' | 'notifications' | 'sounds' | 'archive';

  const activeTab = (tabParam && validTabs.includes(tabParam))
    ? (tabParam as ValidTab)
    : 'professional';

  // Custom Hook for Data management
  const {
    aboutData,
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
    handleDeleteRunningText
  } = useAdminAbout(csrfToken);

  const { isAdmin, isLoading: authLoading } = useAdminAuth();

  if (authLoading || (loading && !aboutData)) {
    return (
      <AdminLayout
        title="Kelola Konten About"
        subtitle="Kelola bagian halaman About"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About' }]}
        titleIcon={<Info className="h-5 w-5" aria-hidden />}
        titleAccent="bg-blue-50 text-blue-700"
      >
        <div className="flex items-center justify-center py-10 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          Memuat data...
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout
        title="Unauthorized"
        subtitle="You need to login to access this page"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About' }]}
        titleIcon={<X className="h-5 w-5" aria-hidden />}
        titleAccent="bg-red-50 text-red-700"
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <InfoIcon className="w-16 h-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600 mb-6">Sesi Anda telah berakhir atau Anda belum masuk.</p>
          <a
            href="/admin/login"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Masuk Sekarang
          </a>
        </div>
      </AdminLayout>
    );
  }

  if (!aboutData) {
    return (
      <AdminLayout
        title="Kelola Konten About"
        subtitle="Kelola bagian halaman About"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About' }]}
        titleIcon={<Info className="h-5 w-5" aria-hidden />}
        titleAccent="bg-blue-50 text-blue-700"
      >
        <div className="flex items-center justify-center py-8">
          <p className="text-red-600">Gagal memuat data about</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Kelola Konten About">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] w-full">
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

            {activeTab === 'philosophy' && (
              <DesignPhilosophyForm />
            )}

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
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-cyan-800 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> Konfigurasi Wallpaper & Tema
                  </h3>
                  <p className="text-sm text-cyan-600 mt-1">
                    Ganti latar belakang desktop dan atur transparansi window.
                  </p>
                </div>
                <WallpaperManager
                  data={aboutData.wallpaperConfig}
                  onUpdate={(data) => handleUpdateAbout({ wallpaperConfig: data })}
                />
              </div>
            )}

            {activeTab === 'desktop' && (
              <div className="space-y-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    <Monitor className="w-5 h-5" /> Konfigurasi Ikon Desktop
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
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

            {activeTab === 'archive' && (
              <GalleryManager
                projects={projects}
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
