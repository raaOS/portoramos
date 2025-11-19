'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
}

export default function AdminLayout({ 
  children, 
  title, 
  subtitle, 
  breadcrumbs = [], 
  actions 
}: AdminLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      router.push('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={() => router.push('/admin')}
                className="text-lg sm:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors truncate"
              >
                Admin Dashboard
              </button>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 ml-4">
              <button
                onClick={() => router.push('/')}
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="hidden sm:inline">View Site</span>
                <span className="sm:hidden">Site</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-red-600 hover:text-red-700 transition-colors px-2 py-1 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-1 sm:space-x-2 py-3 overflow-x-auto">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center flex-shrink-0">
                  {index > 0 && (
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mx-1 sm:mx-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {crumb.href ? (
                    <button
                      onClick={() => router.push(crumb.href!)}
                      className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 py-0.5"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-500 truncate">{crumb.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{title}</h1>
              {subtitle && (
                <p className="mt-1 sm:mt-2 text-base sm:text-lg text-gray-600">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
