import type { ReactNode } from 'react';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import ClientAdminLayout from './components/ClientAdminLayout';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AdminErrorBoundary>
            <ClientAdminLayout>
                {children}
            </ClientAdminLayout>
        </AdminErrorBoundary>
    );
}
