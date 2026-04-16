'use client';

import { ReactNode, Suspense } from 'react';
import { Menu, X } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Extracted Hook & Components
import { useAdminSidebar } from './hooks/useAdminSidebar';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  titleIcon?: ReactNode;
  titleAccent?: string;
}

function AdminLayoutContent({
  children,
  title,
  actions,
  titleIcon,
  titleAccent = 'bg-blue-50 text-blue-700'
}: AdminLayoutProps) {
  const { logout } = useAdminAuth();
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    expandedMenus,
    toggleMenu,
    isActive
  } = useAdminSidebar();

  const handleLogout = async () => {
    await logout();
  };

  const handleContentClick = () => {
    if (!sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  };

  // Dynamic margin for content area based on sidebar state
  const contentMargin = sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-64';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
        <span className="font-bold text-lg">Admin Panel</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
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
        className={`flex-1 min-h-screen pt-16 md:pt-0 bg-gray-50 flex flex-col ${contentMargin} transition-all duration-300 ease-in-out ${!sidebarCollapsed ? 'cursor-pointer' : ''}`}
      >
        <AdminHeader
          title={title}
          titleIcon={titleIcon}
          titleAccent={titleAccent}
          actions={actions}
        />

        {/* Page Content */}
        <div className="p-6 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout(props: AdminLayoutProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">Loading admin...</div>}>
      <AdminLayoutContent {...props} />
    </Suspense>
  );
}