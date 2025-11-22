'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Import design system components
import AdminLayout from './components/AdminLayout';
import AdminCard from './components/AdminCard';
import AdminButton from './components/AdminButton';
import { useToast } from '@/contexts/ToastContext';

export default function AdminDashboardClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { showSuccess: success, showError: error } = useToast();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
            if (data.authenticated) {
              setIsAuthenticated(true);
            } else {
            router.push('/admin/login');
          }
        } else {
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <>
      <AdminLayout
        title="Dashboard"
        subtitle="Portfolio Management"
        breadcrumbs={[{ label: 'Dashboard' }]}
      >
        <div className="grid gap-6 md:grid-cols-3">
          <AdminCard>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Welcome back</p>
              <p className="text-2xl font-semibold text-gray-900">Admin</p>
              <p className="text-sm text-gray-500">
                Use the left navigation to manage your portfolio content.
              </p>
            </div>
          </AdminCard>
          <AdminCard>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Quick tips</p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Projects are the primary content on your site.</li>
                <li>About, Contact, and Experience support your profile.</li>
                <li>Testimonials help build trust with visitors.</li>
              </ul>
            </div>
          </AdminCard>
          <AdminCard>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Shortcuts</p>
              <div className="flex flex-wrap gap-2">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/admin/projects')}
                >
                  Manage Projects
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/admin/about')}
                >
                  Edit About
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/admin/testimonial')}
                >
                  Testimonials
                </AdminButton>
              </div>
            </div>
          </AdminCard>
        </div>
      </AdminLayout>
    </>
  );
}
