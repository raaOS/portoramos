'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_PREFETCH_HREFS, warmAdminCrudQueries } from '../lib/adminQueries';
import { ConfirmDialogProvider } from '@/components/admin/ConfirmDialog';

// Extracted Hook & Components
import { useAdminSidebar } from './hooks/useAdminSidebar';
import { AdminSidebar } from './components/AdminSidebar';

interface ClientAdminLayoutProps {
  children: ReactNode;
}

export default function ClientAdminLayout({ children }: ClientAdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAdminAuth();
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    expandedMenus,
    toggleMenu,
    isActive,
  } = useAdminSidebar();

  const handleLogout = async () => {
    await logout();
  };

  const handleContentClick = () => {
    if (!sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  };

  const warmedRef = useRef(false);

  useEffect(() => {
    if (pathname === '/admin/login') return;
    // PERF: warm query + RSC prefetch hanya sekali per sesi admin (tidak
    // re-run tiap navigasi). Pakai ref guard agar saat user baru login dan
    // pathname pindah dari /admin/login ke /admin/projects, warm tetap jalan.
    if (warmedRef.current) return;
    warmedRef.current = true;

    const timeout = window.setTimeout(() => {
      ADMIN_PREFETCH_HREFS.forEach((href) => router.prefetch(href));
      void warmAdminCrudQueries(queryClient);
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [pathname, queryClient, router]);

  // Do not render the sidebar layout on the login page
  if (pathname === '/admin/login') {
    return <ConfirmDialogProvider>{children}</ConfirmDialogProvider>;
  }

  // Dynamic margin for content area based on sidebar state
  const contentMargin = sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64';

  return (
    <ConfirmDialogProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile Top Bar */}
        <div className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
          <span className="text-lg font-bold">Admin Panel</span>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar Overlay (Mobile) */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          expandedMenus={expandedMenus}
          toggleMenu={toggleMenu}
          isActive={isActive}
          handleLogout={handleLogout}
        />

        {/* Main Content Wrapper - click to collapse sidebar */}
        <div
          onClick={handleContentClick}
          className={`flex min-h-screen flex-1 flex-col bg-gray-50 pt-16 md:pt-0 ${contentMargin} transition-all duration-300 ease-in-out ${!sidebarCollapsed ? 'cursor-pointer' : ''}`}
        >
          {children}
        </div>
      </div>
    </ConfirmDialogProvider>
  );
}
