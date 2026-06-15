'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { User, Sparkles } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminContent } from '@/app/admin/hooks/useAdminContent';
import ProfessionalSectionForm from '@/app/admin/content/components/ProfessionalSectionForm';
import AdminLoading from '@/components/admin/AdminLoading';

const DesignPhilosophyForm = dynamic(
  () => import('@/components/admin/about/DesignPhilosophyForm'),
  { loading: () => <AdminLoading size="default" /> }
);

export default function ProfilePanel() {
  const { csrfToken } = useAdminAuth();
  const { contentData, loading, error, projects, handleUpdateContent } = useAdminContent(csrfToken);

  const [activeSubTab, setActiveSubTab] = useState<'info' | 'philosophy'>('info');

  if (loading && !contentData) {
    return <AdminLoading size="default" />;
  }

  if (!contentData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-600">Gagal memuat data profil.</p>
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
          Design Thinking
        </button>
      </div>

      <div className="min-h-[400px] w-full rounded-lg border border-gray-200 bg-white p-6">
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
  );
}
