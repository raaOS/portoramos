'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/admin')}
              className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              Admin
            </button>
            <nav className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <Link href="/admin/projects" className="hover:text-gray-900">
                Projects
              </Link>
              <Link href="/admin/about" className="hover:text-gray-900">
                About
              </Link>
              <Link href="/admin/experience" className="hover:text-gray-900">
                Experience
              </Link>
              <Link href="/admin/contact" className="hover:text-gray-900">
                Contact
              </Link>
              <Link href="/admin/testimonial" className="hover:text-gray-900">
                Testimonials
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 ml-4">
            <button
              onClick={() => router.push('/')}
              className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              View Site
            </button>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm text-red-600 hover:text-red-700 transition-colors px-2 py-1 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col lg:flex-row gap-6">
        {/* Sidebar for breadcrumbs and page title */}
        <aside className="w-full lg:w-64 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>

          {breadcrumbs.length > 0 && (
            <nav className="bg-white border border-gray-200 rounded-lg p-3">
              <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
                {breadcrumbs.map((crumb, index) => (
                  <li key={index} className="flex items-center">
                    {index > 0 && <span className="mx-1 text-gray-400">/</span>}
                    {crumb.href ? (
                      <button
                        onClick={() => router.push(crumb.href!)}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {actions && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
              {actions}
            </div>
          )}
        </aside>

        {/* Main content */}
        <section className="flex-1">
          {children}
        </section>
      </main>
    </div>
  );
}
