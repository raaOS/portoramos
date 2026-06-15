import type { ReactNode } from 'react';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import ClientAdminLayout from './components/ClientAdminLayout';
import QueryProvider from '@/components/layout/QueryProvider';

// Admin area butuh auth runtime. Force-dynamic di layout level diperlukan
// karena ClientAdminLayout (lewat useAdminSidebar) memanggil useSearchParams
// untuk derive expanded menu state. Tanpa force-dynamic, Next.js akan
// mencoba static-render segment dan bail out / hang intermittent saat chunk
// bundling tertentu — gejala: /admin/login kadang bisa kadang gak.
//
// Catatan perf: gain utama performance navigasi antar menu CRUD bukan dari
// menghapus force-dynamic ini, tapi dari shared singleton runtime
// (useAdminAuth, useDataStatus, useRealtimeSync), Suspense fallback null,
// dan Link prefetch di sidebar. Force-dynamic di layout hanya mempengaruhi
// RSC fresh-render per navigasi, dan itu acceptable trade-off vs login
// flicker.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminErrorBoundary>
      <QueryProvider>
        <ClientAdminLayout>{children}</ClientAdminLayout>
      </QueryProvider>
    </AdminErrorBoundary>
  );
}
