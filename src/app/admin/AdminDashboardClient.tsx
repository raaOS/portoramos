'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Import design system components
import AdminLayout from './components/AdminLayout';
import AdminCard from './components/AdminCard';
import AdminButton from './components/AdminButton';
import { useToast } from '@/contexts/ToastContext';

// Import existing admin components
import AdminProjectsClient from './projects/AdminProjectsClient';
import AdminAboutClient from './about/AdminAboutClient';
import AdminContactClient from './contact/AdminContactClient';
import AdminExperienceClient from './experience/AdminExperienceClient';
import AdminTestimonialClient from './testimonial/AdminTestimonialClient';

type TabType = 'projects' | 'about' | 'contact' | 'experience' | 'testimonial';

interface DashboardStats {
  projects: number;
  lastUpdated: string;
}

export default function AdminDashboardClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    lastUpdated: new Date().toISOString()
  });
  const router = useRouter();
  const { showSuccess: success, showError: error } = useToast();

  // Load dashboard stats
  const loadStats = useCallback(async () => {
    try {
      const projectsRes = await fetch('/api/projects');
      const projectsData = await projectsRes.json();
      
      setStats({
        projects: projectsData.projects?.length || 0,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      error('Failed to load dashboard stats');
    }
  }, [error]);

  // Restore last active tab from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('adminActiveTab') as TabType | null;
    const allowedTabs: TabType[] = ['projects', 'about', 'contact', 'experience', 'testimonial'];
    if (stored && allowedTabs.includes(stored)) {
      setActiveTab(stored);
    }
  }, []);

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
            await loadStats();
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
  }, [loadStats, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      success('Logged out successfully');
    } catch (err) {
      console.error('Logout error:', err);
      error('Logout failed');
    } finally {
      router.push('/admin/login');
    }
  };

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  const tabs = [
    { id: 'projects', name: `Projects (${stats.projects})`, icon: 'folder' },
    { id: 'about', name: 'About', icon: 'user' },
    { id: 'contact', name: 'Contact', icon: 'phone' },
    { id: 'experience', name: 'Experience', icon: 'briefcase' },
    { id: 'testimonial', name: 'Testimonial', icon: 'message-circle' }
  ] as const;

  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.name || '';

  const breadcrumbs = [
    { label: 'Dashboard' },
    { label: activeTabLabel }
  ];

  return (
    <>
      <AdminLayout
        title="Dashboard"
        subtitle="Portfolio Management"
        breadcrumbs={breadcrumbs}
      >
        {/* Quick Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.projects}</div>
              <div className="text-sm text-gray-500">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Online</div>
              <div className="text-sm text-gray-500">Status</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <AdminCard>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem('adminActiveTab', tab.id);
                    }
                  }}
                  className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon === 'folder' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                    </svg>
                  )}
                  {tab.icon === 'user' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {tab.icon === 'phone' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  )}
                  {tab.icon === 'briefcase' && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  )}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="mt-4">
            {activeTab === 'projects' && <AdminProjectsClient />}
            {activeTab === 'about' && <AdminAboutClient />}
            {activeTab === 'contact' && <AdminContactClient />}
            {activeTab === 'experience' && <AdminExperienceClient />}
        {activeTab === 'testimonial' && <AdminTestimonialClient />}
          </div>
        </AdminCard>
      </AdminLayout>
    </>
  );
}
