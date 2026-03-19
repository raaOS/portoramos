'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * HIGH FIX: Eliminate double auth check
 * Server-side (page.tsx) already verified admin_token cookie and JWT validity.
 * If we reach this client component, auth is guaranteed by server.
 * Just redirect to projects dashboard immediately without extra API call.
 */
export default function AdminDashboardClient() {
  const router = useRouter();

  useEffect(() => {
    // Server already verified auth, just redirect to projects
    router.push('/admin/projects');
  }, [router]);

  // Render minimal loader while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading dashboard...</div>
    </div>
  );
}
