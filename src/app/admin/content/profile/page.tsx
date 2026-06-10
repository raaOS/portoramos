'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { User, Sparkles } from 'lucide-react';
import { AdminAuthGuard } from '../../components/AdminAuthGuard';
import { AdminHeader } from '../../components/components/AdminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminContent } from '../../hooks/useAdminContent';
import ProfessionalSectionForm from '../components/ProfessionalSectionForm';
import AdminLoading from '@/components/admin/AdminLoading';

const DesignPhilosophyForm = dynamic(
  () => import('@/components/admin/about/DesignPhilosophyForm'),
  { loading: () => <AdminLoading size="default" /> }
);

function ProfileClientContent() {
  const { csrfToken } = useAdminAuth();
  const { contentData, loading, error, projects, handleUpdateContent } = useAdminContent(csrfToken);

  const [activeSubTab, setActiveSubTab] = useState<'info' | 'philosophy'>('info');

  if (loading && !contentData) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <AdminLoading size="default" />
      </div>
    );
  }

  if (!contentData) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-red-600">Gagal memuat data profil.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Info Utama & Design Thinking"
        titleIcon={<User className="h-5 w-5" aria-hidden />}
        titleAccent="bg-blue-50 text-blue-700"
      />

      <div className="flex-1 space-y-6 p-6">
        {error && (
          <div className="mb-6 flex items-center justify-between rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <span>{error}</span>
          </div>
        )}

        {/* Sub-Tabs Selector */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
              activeSubTab === 'info'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <User className="h-4 w-4" />
            Info Utama & Status
          </button>
          <button
            onClick={() => setActiveSubTab('philosophy')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
              activeSubTab === 'philosophy'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Design Thinking Framework
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px] w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          {activeSubTab === 'info' ? (
            <ProfessionalSectionForm
              data={contentData.professional}
              heroData={contentData.hero}
              projects={projects}
              onUpdate={handleUpdateContent}
            />
          ) : (
            <DesignPhilosophyForm />
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminProfilePage() {
  return (
    <AdminAuthGuard>
      <ProfileClientContent />
    </AdminAuthGuard>
  );
}
