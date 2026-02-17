import type { ReactNode } from 'react';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AdminErrorBoundary>
            <div className="container">
                {children}
            </div>
        </AdminErrorBoundary>
    );
}
