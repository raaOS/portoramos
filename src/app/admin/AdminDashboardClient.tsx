'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardClient() {
  const router = useRouter();

  // [STICKY NOTE] AUTH GUARD (PENJAGA PINTU)
  // Memastikan hanya user yang sudah login (punya cookie sesi) yang bisa masuk sini.
  // Jika server bilang "tidak authenticated", tendang balik ke halaman login.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            // Redirect to projects immediately
            router.push('/admin/projects');
          } else {
            router.push('/admin/login');
          }
        } else {
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  // Render nothing or a minimal loader while redirecting
  return null;
}
