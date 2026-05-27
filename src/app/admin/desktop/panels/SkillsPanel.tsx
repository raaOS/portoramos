'use client';

import { useState } from 'react';
import { Brain, Settings } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminContent } from '@/app/admin/hooks/useAdminContent';
import SoftSkillsSectionForm from '@/app/admin/content/components/SoftSkillsSectionForm';
import HardSkillsManager from '@/app/admin/content/components/HardSkillsManager';
import AdminLoading from '@/components/admin/AdminLoading';

export default function SkillsPanel() {
  const { csrfToken } = useAdminAuth();
  const { contentData, loading, error, handleUpdateContent } =
    useAdminContent(csrfToken);

  const [activeSubTab, setActiveSubTab] = useState<'soft' | 'hard'>('soft');

  if (loading && !contentData) return <AdminLoading size="default" />;

  if (!contentData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-600">Gagal memuat data skills.</p>
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
          onClick={() => setActiveSubTab('soft')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
            activeSubTab === 'soft'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <Brain className="h-4 w-4" />
          Soft Skills
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
          Hard Skills
        </button>
      </div>

      <div className="min-h-[400px] w-full rounded-lg border border-gray-200 bg-white p-6">
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
  );
}
