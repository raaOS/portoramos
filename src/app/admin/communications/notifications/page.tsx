'use client';

import { MessageSquare } from 'lucide-react';
import { AdminAuthGuard } from '@/app/admin/components/AdminAuthGuard';
import { AdminHeader } from '@/app/admin/components/components/AdminHeader';
import AdminTestimonialClient from '@/app/admin/communications/notifications/AdminTestimonialClient';

function NotificationsClientContent() {
  return (
    <>
      <AdminHeader
        title="Komunikasi & Testimoni (WhatsApp)"
        titleIcon={<MessageSquare className="h-5 w-5" aria-hidden />}
        titleAccent="bg-green-50 text-green-700"
      />

      <div className="flex-1 space-y-6 p-6">
        <AdminTestimonialClient />
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
