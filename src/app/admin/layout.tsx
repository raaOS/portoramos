import type { ReactNode } from 'react';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import ClientAdminLayout from './components/ClientAdminLayout';

// Admin area butuh auth runtime, jangan di-prerender.
// Ini juga otomatis bypass CSR bailout error untuk useSearchParams/useRouter
// di semua child page (/admin/about, /admin/projects, dll).
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AdminErrorBoundary>
            <ClientAdminLayout>
                {children}
            </ClientAdminLayout>
        </AdminErrorBoundary>
    );
}
