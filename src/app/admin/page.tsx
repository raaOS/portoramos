import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken } from '@/lib/auth';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
  // Server-side auth guard
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value || cookieStore.get('admin-token')?.value;

  const isAuthenticated = token ? verifyAdminToken(token) : false;

  if (!isAuthenticated) {
    redirect('/admin/login');
  }

  return (
    <Suspense fallback={null}>
      <AdminDashboardClient />
    </Suspense>
  );
}
