'use client';

import { useState } from 'react';
import { Smile, Type } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminSystem } from '@/app/admin/hooks/useAdminSystem';
import StickyNotesManager from '@/app/admin/system/components/StickyNotesManager';
import RunningTextPanel from '@/app/admin/system/components/RunningTextPanel';
import AdminLoading from '@/components/admin/AdminLoading';

export default function WidgetsPanel() {
  const { csrfToken } = useAdminAuth();
  const {
    systemData, loading, error,
    runningTexts, runningTextsLoading,
    handleCreateRunningText, handleUpdateRunningText, handleDeleteRunningText,
  } = useAdminSystem(csrfToken);

  const [activeSubTab, setActiveSubTab] = useState<'sticky' | 'ticker'>('sticky');

  if (loading && !systemData) return <AdminLoading size="default" />;

  if (!systemData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-600">Gagal memuat data widget.</p>
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
          onClick={() => setActiveSubTab('sticky')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
            activeSubTab === 'sticky'
              ? 'border-yellow-600 text-yellow-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <Smile className="h-4 w-4" />
          Sticky Notes
        </button>
        <button
          onClick={() => setActiveSubTab('ticker')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
            activeSubTab === 'ticker'
              ? 'border-yellow-600 text-yellow-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <Type className="h-4 w-4" />
          Running Ticker
        </button>
      </div>

      <div className="min-h-[400px] w-full rounded-lg border border-gray-200 bg-white p-6">
        {activeSubTab === 'sticky' ? (
          <StickyNotesManager />
        ) : (
          <RunningTextPanel
            items={runningTexts}
            loading={runningTextsLoading}
            onCreate={handleCreateRunningText}
            onUpdate={handleUpdateRunningText}
            onDelete={handleDeleteRunningText}
          />
        )}
      </div>
    </div>
  );
}
