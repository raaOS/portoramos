'use client';

import { useState } from 'react';
import { Brain, Settings } from 'lucide-react';
import { AdminAuthGuard } from '../../components/AdminAuthGuard';
import { AdminHeader } from '../../components/components/AdminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminContent } from '../../hooks/useAdminContent';
import SoftSkillsSectionForm from '../components/SoftSkillsSectionForm';
import HardSkillsManager from '../components/HardSkillsManager';
import AdminLoading from '@/components/admin/AdminLoading';

function SkillsClientContent() {
  const { csrfToken } = useAdminAuth();
  const {
    contentData,
    loading,
    error,
    handleUpdateContent,
  } = useAdminContent(csrfToken);

  const [activeSubTab, setActiveSubTab] = useState<'soft' | 'hard'>('soft');

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
          <p className="text-red-600">Gagal memuat data skills.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Kelola Skillset"
        titleIcon={<Brain className="h-5 w-5" aria-hidden />}
        titleAccent="bg-violet-50 text-violet-700"
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
            onClick={() => setActiveSubTab('soft')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
              activeSubTab === 'soft'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Brain className="h-4 w-4" />
            Soft Skills (Interpersonal)
          </button>
          <button
            onClick={() => setActiveSubTab('hard')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
              activeSubTab === 'hard'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4" />
            Hard Skills (Technical)
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px] w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          {activeSubTab === 'soft' ? (
            <SoftSkillsSectionForm
              data={contentData.softSkills || {}}
              onUpdate={(data) => handleUpdateContent({ softSkills: data })}
            />
          ) : (
            <HardSkillsManager />
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminSkillsPage() {
  return (
    <AdminAuthGuard>
      <SkillsClientContent />
    </AdminAuthGuard>
  );
}
