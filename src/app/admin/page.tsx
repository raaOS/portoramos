import { Suspense } from 'react';
import AdminDashboardClient from './AdminDashboardClient';

export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading component module...</div>}>
      <AdminDashboardClient />
    </Suspense>
  );
}

