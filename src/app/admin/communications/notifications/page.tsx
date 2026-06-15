'use client';

import { useState } from 'react';
import { MessageSquare, Bell } from 'lucide-react';
import { AdminAuthGuard } from '@/app/admin/components/AdminAuthGuard';
import { AdminHeader } from '@/app/admin/components/components/AdminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminSystem } from '@/app/admin/hooks/useAdminSystem';
import AdminTestimonialClient from '@/app/admin/communications/notifications/AdminTestimonialClient';
import NotificationsManager from '@/app/admin/communications/components/NotificationsManager';
import AdminLoading from '@/components/admin/AdminLoading';

function NotificationsClientContent() {
  const { csrfToken } = useAdminAuth();
  const { systemData, loading: systemLoading, handleUpdateSystem } = useAdminSystem(csrfToken);

  const [activeSubTab, setActiveSubTab] = useState<'whatsapp' | 'island'>('whatsapp');

  return (
    <>
      <AdminHeader
        title="Komunikasi & Notifikasi"
        titleIcon={<MessageSquare className="h-5 w-5" aria-hidden />}
        titleAccent="bg-green-50 text-green-700"
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Sub-Tabs Selector */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSubTab('whatsapp')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
              activeSubTab === 'whatsapp'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Simulasi Chat (WhatsApp)
          </button>
          <button
            onClick={() => setActiveSubTab('island')}
            className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
              activeSubTab === 'island'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Bell className="h-4 w-4" />
            Notifikasi Dynamic Island
          </button>
        </div>

        {/* Tab Content */}
        {activeSubTab === 'whatsapp' ? (
          <AdminTestimonialClient />
        ) : (
          <div className="min-h-[500px] w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
            {systemLoading && !systemData ? (
              <AdminLoading size="default" />
            ) : systemData ? (
              <div className="space-y-8">
                <NotificationsManager
                  notifications={systemData.islandNotifications || []}
                  onUpdate={(data) => handleUpdateSystem({ islandNotifications: data })}
                />
              </div>
            ) : (
              <p className="text-red-600">Gagal memuat notifikasi.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminNotificationsPage() {
  return (
    <AdminAuthGuard>
      <NotificationsClientContent />
    </AdminAuthGuard>
  );
}
