'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Rocket, Lightbulb } from 'lucide-react';

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
        titleIcon={<LayoutDashboard className="h-5 w-5" aria-hidden />}
        titleAccent="bg-slate-100 text-slate-700"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <AdminCard
            tone="blue"
            icon={<Rocket className="h-5 w-5" aria-hidden />}
            title="Welcome back"
          >
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-gray-900">Admin</p>
              <p className="text-sm text-gray-500">
                Use the left navigation to manage your portfolio content.
              </p>
            </div>
          </AdminCard>
          <AdminCard
            tone="amber"
            icon={<Lightbulb className="h-5 w-5" aria-hidden />}
            title="Quick tips"
          >
            <div className="space-y-2">
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Projects are the primary content on your site.</li>
                <li>About, Contact, and Experience support your profile.</li>
                <li>Testimonials help build trust with visitors.</li>
              </ul>
            </div>
          </AdminCard>
          <AdminCard
            tone="emerald"
            icon={<LayoutDashboard className="h-5 w-5" aria-hidden />}
            title="Shortcuts"
          >
            <div className="space-y-2">
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
