'use client';

import { useState, ReactNode } from 'react';
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
  Users,
  Send,
  Menu,
  X
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    { href: '/admin/projects', label: 'Projects', icon: FolderKanban, color: 'text-purple-600', bg: 'hover:bg-purple-50' },
    { href: '/admin/about', label: 'About', icon: Info, color: 'text-blue-600', bg: 'hover:bg-blue-50' },
    { href: '/admin/experience', label: 'Experience', icon: BriefcaseBusiness, color: 'text-emerald-600', bg: 'hover:bg-emerald-50' },
    { href: '/admin/contact', label: 'Contact', icon: PhoneCall, color: 'text-amber-600', bg: 'hover:bg-amber-50' },
    { href: '/admin/testimonial', label: 'Testimonials', icon: Quote, color: 'text-pink-600', bg: 'hover:bg-pink-50' },
    { href: '/admin/leads', label: 'Leads', icon: Users, color: 'text-indigo-600', bg: 'hover:bg-indigo-50' },
    { href: '/admin/telegram', label: 'Telegram Bot', icon: Send, color: 'text-sky-500', bg: 'hover:bg-sky-50' },
    { href: '/admin/analytics', label: 'Analytics', icon: Activity as any, color: 'text-orange-600', bg: 'hover:bg-orange-50' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4">
        <span className="font-bold text-lg">Admin Panel</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-30 transform transition-transform duration-200 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <LayoutDashboard className="h-6 w-6 text-gray-800 mr-2" />
            <span className="font-bold text-xl text-gray-900">Admin</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon, color, bg }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                    ? 'bg-gray-100 text-gray-900 shadow-sm'
                    : `text-gray-600 ${bg} hover:text-gray-900`
                    }`}
                >
                  <Icon className={`h-5 w-5 ${active ? color : 'text-gray-400'}`} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <Eye className="h-5 w-5" />
              View Site
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0">
        {/* Breadcrumb Header */}
        <div className="bg-white border-b border-gray-200 sticky top-16 md:top-0 z-10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {titleIcon && (
              <div className={`p-2 rounded-lg ${titleAccent}`}>
                {titleIcon}
              </div>
            )}
            <div>
              <nav className="flex text-sm text-gray-500 mb-0.5">
                {breadcrumbs.map((crumb, idx) => (
                  <div key={idx} className="flex items-center">
                    {idx > 0 && <span className="mx-2">/</span>}
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-gray-900 transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">{crumb.label}</span>
                    )}
                  </div>
                ))}
              </nav>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>

        {/* Page Content */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

