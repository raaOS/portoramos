'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Info,
  BriefcaseBusiness,
  PhoneCall,
  Quote,
  Eye,
  LogOut,
  Activity,
  Bot,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  titleIcon?: ReactNode;
  titleAccent?: string;
}

export default function AdminLayout({
  children,
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  titleIcon,
  titleAccent = 'bg-blue-50 text-blue-700'
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

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

  const navItems = [
    { href: '/admin/projects', label: 'Projects', icon: FolderKanban, color: 'text-purple-600' },
    { href: '/admin/about', label: 'About', icon: Info, color: 'text-blue-600' },
    { href: '/admin/experience', label: 'Experience', icon: BriefcaseBusiness, color: 'text-emerald-600' },
    { href: '/admin/contact', label: 'Contact', icon: PhoneCall, color: 'text-amber-600' },
    { href: '/admin/testimonial', label: 'Testimonials', icon: Quote, color: 'text-pink-600' },
    { href: '/admin/analytics', label: 'Analytics', icon: Activity as any, color: 'text-orange-600' },
    { href: '/admin/ai-hunter', label: 'AI Hunter', icon: Bot, color: 'text-indigo-600' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <nav className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              {navItems.map(({ href, label, icon: Icon, color }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-2 py-1 transition ${active ? `${color} font-semibold` : 'text-gray-900'}`}
                    aria-label={label}
                    title={label}
                  >
                    <Icon className={`h-4 w-4 ${active ? color : 'text-gray-800'}`} aria-hidden />
                    <span className="hidden xl:inline font-medium">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 ml-4">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Eye className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">View Site</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-red-600 hover:text-red-700 transition-colors px-2 py-1 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col lg:flex-row gap-6">
        {/* Sidebar for breadcrumbs and page title */}
        <aside className="w-full lg:w-64 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {titleIcon && (
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${titleAccent} shadow-sm`}>
                  {titleIcon}
                </span>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>
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
