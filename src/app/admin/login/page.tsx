import type { Metadata, Viewport } from 'next';
import AdminLoginClient from './_components/AdminLoginClient';

export const metadata: Metadata = {
  title: 'Admin Login | Ramos OS',
  description: 'Access the admin dashboard.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#f9fafb',
  width: 'device-width',
  initialScale: 1,
};

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}
