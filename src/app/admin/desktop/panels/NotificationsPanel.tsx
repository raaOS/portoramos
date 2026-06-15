'use client';

import { useState } from 'react';
import { MessageSquare, Bell } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminSystem } from '@/app/admin/hooks/useAdminSystem';
import AdminTestimonialClient from '@/app/admin/communications/notifications/AdminTestimonialClient';
import NotificationsManager from '@/app/admin/communications/components/NotificationsManager';
import AdminLoading from '@/components/admin/AdminLoading';

export default function NotificationsPanel() {
  const { csrfToken } = useAdminAuth();
  const { systemData, loading: systemLoading, handleUpdateSystem } = useAdminSystem(csrfToken);

  const [activeSubTab, setActiveSubTab] = useState<'whatsapp' | 'island'>('whatsapp');

  return (
    <div className="space-y-6 p-6">
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
          Simulasi Chat
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
          Dynamic Island
        </button>
      </div>

      {activeSubTab === 'whatsapp' ? (
        <AdminTestimonialClient />
      ) : (
        <div className="min-h-[400px] w-full rounded-lg border border-gray-200 bg-white p-6">
          {systemLoading && !systemData ? (
            <AdminLoading size="default" />
          ) : systemData ? (
            <NotificationsManager
              notifications={systemData.islandNotifications || []}
              onUpdate={(data) => handleUpdateSystem({ islandNotifications: data })}
            />
          ) : (
            <p className="text-red-600">Gagal memuat notifikasi.</p>
          )}
        </div>
      )}
    </div>
  );
}
