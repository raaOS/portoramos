'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Info, Monitor, MessageSquare, Layout, Smile, BriefcaseBusiness, Dumbbell, Terminal, Palette, MessageCircle, Info as InfoIcon, X } from 'lucide-react';
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
import ChatSettingsForm from './components/ChatSettingsForm';
import StickyNotesManager from './components/StickyNotesManager';
import NotificationsManager from './components/NotificationsManager';
import HardSkillsManager from './components/HardSkillsManager';

// Lazy load heavy third-party components
const DesignPhilosophyForm = dynamic(() => import('@/components/admin/about/DesignPhilosophyForm'));

export default function AdminAboutClient() {
  const { csrfToken } = useAdminAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'professional' | 'softSkills' | 'hardSkills' | 'runningText' | 'philosophy' | 'desktop' | 'dock' | 'chat' | 'stickyNotes' | 'notifications'>('professional');

  // Custom Hook for Data management
  const {
    aboutData,
    loading,
    error,
    projects,
    runningTexts,
    runningTextsLoading,
    handleUpdateAbout,
    handleCreateRunningText,
    handleUpdateRunningText,
    handleDeleteRunningText
  } = useAdminAbout(csrfToken);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['professional', 'softSkills', 'hardSkills', 'runningText', 'philosophy', 'labels', 'desktop', 'dock', 'chat', 'stickyNotes', 'notifications'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <AdminLayout
        title="Kelola Konten About"
        subtitle="Kelola bagian halaman About"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'About' }]}
        titleIcon={<Info className="h-5 w-5" aria-hidden />}
        titleAccent="bg-blue-50 text-blue-700"
      >
        <div className="flex items-center justify-center py-10 text-sm text-gray-600">
          Memuat data about...
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

            {activeTab === 'desktop' && (
              <div className="space-y-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    <Monitor className="w-5 h-5" /> Konfigurasi Desktop OS
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
                    Start Menu, Icon Desktop, dan perilaku Window.
                  </p>
                </div>
                <WallpaperManager
                  data={aboutData.wallpaperConfig}
                  onUpdate={(data) => handleUpdateAbout({ wallpaperConfig: data })}
                />
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

            {activeTab === 'chat' && (
              <div className="space-y-8">
                <ChatSettingsForm
                  data={aboutData.chatSettings}
                  onUpdate={(data) => handleUpdateAbout({ chatSettings: data })}
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
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
