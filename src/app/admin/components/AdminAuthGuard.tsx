'use client';

import { ReactNode } from 'react';
import { Info, X } from 'lucide-react';
import { AdminHeader } from './components/AdminHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLoading from '@/components/admin/AdminLoading';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { isAdmin, isLoading: authLoading } = useAdminAuth();

  if (authLoading) {
    return (
      <>
        <AdminHeader
          title="Loading..."
          titleIcon={<Info className="h-5 w-5" aria-hidden />}
          titleAccent="bg-blue-50 text-blue-700"
        />
        <div className="flex-1 space-y-6 p-6">
          <AdminLoading size="default" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <AdminHeader
          title="Unauthorized"
          titleIcon={<X className="h-5 w-5" aria-hidden />}
          titleAccent="bg-red-50 text-red-700"
        />
        <div className="flex-1 space-y-6 p-6">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Info className="mb-4 h-16 w-16 text-yellow-500" aria-hidden />
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Akses Terbatas</h2>
            <p className="mb-6 text-gray-600">Sesi Anda telah berakhir atau Anda belum masuk.</p>
            <a
              href="/admin/login"
              className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Masuk Sekarang
            </a>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
