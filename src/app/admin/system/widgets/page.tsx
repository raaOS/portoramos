'use client';

import { useState } from 'react';
import { Smile } from 'lucide-react';
import { AdminAuthGuard } from '../../components/AdminAuthGuard';
import { AdminHeader } from '../../components/components/AdminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminSystem } from '../../hooks/useAdminSystem';
import StickyNotesManager from '../components/StickyNotesManager';
import AdminLoading from '@/components/admin/AdminLoading';

function WidgetsClientContent() {
  const { csrfToken } = useAdminAuth();
  const { systemData, loading, error } = useAdminSystem(csrfToken);

  const [activeSubTab, setActiveSubTab] = useState<'sticky'>('sticky');

  if (loading && !systemData) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <AdminLoading size="default" />
      </div>
    );
  }

  if (!systemData) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-red-600">Gagal memuat data widget.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminHeader
        title="Catatan & Widget"
        titleIcon={<Smile className="h-5 w-5" aria-hidden />}
        titleAccent="bg-yellow-50 text-yellow-700"
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
            onClick={() => setActiveSubTab('sticky')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
              activeSubTab === 'sticky'
                ? 'border-yellow-600 text-yellow-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Smile className="h-4 w-4" />
            Catatan Tempel (Sticky Notes)
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px] w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          <StickyNotesManager />
        </div>
      </div>
    </>
  );
}

export default function AdminWidgetsPage() {
  return (
    <AdminAuthGuard>
      <WidgetsClientContent />
    </AdminAuthGuard>
  );
}
