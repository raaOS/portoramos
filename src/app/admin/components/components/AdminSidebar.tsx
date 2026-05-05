'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Eye, LogOut, ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { NAV_ITEMS, type NavItem } from '../AdminConstants';
import { prefetchAdminRoute } from '../../lib/adminQueries';

interface AdminSidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  expandedMenus: Record<string, boolean>;
  toggleMenu: (href: string) => void;
  isActive: (href: string) => boolean;
  handleLogout: () => Promise<void>;
}

const NavIcon = ({ icon: IconComponent, className }: { icon: LucideIcon; className?: string }) => {
  return <IconComponent className={className || ''} aria-hidden="true" />;
};

export const AdminSidebar = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  expandedMenus,
  toggleMenu,
  isActive,
  handleLogout
}: AdminSidebarProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const warmRoute = (href: string) => {
    if (href.endsWith('-group') || href === '/admin/os-config') return;

    router.prefetch(href);
    void prefetchAdminRoute(queryClient, href);
  };

  const handleNavItemClick = (item: NavItem) => {
    const isVirtualGroup = item.href.endsWith('-group') || item.href === '/admin/os-config';

    // If collapsed, just expand - don't navigate
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      return;
    }

    if (!isVirtualGroup) {
      warmRoute(item.href);
      router.push(item.href);
    }
    if (item.children && item.children.length > 0) {
      toggleMenu(item.href);
    }
    setIsMobileMenuOpen(false);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.href];

    // Determine padding based on depth - we keep it simple for admin
    const depthPadding = depth * 12;

    return (
      <div key={item.href} className="mb-0.5">
        <div
          className={`
            group flex items-center justify-between py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
            ${active && !hasChildren ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900 ' + item.bg}
          `}
          style={{ paddingLeft: `${sidebarCollapsed ? '0' : '12px'}`, paddingRight: '12px' }}
          onMouseEnter={() => warmRoute(item.href)}
          onFocus={() => warmRoute(item.href)}
          onClick={() => handleNavItemClick(item)}
        >
          <div className="flex items-center min-w-0 flex-1 overflow-hidden">
            {/* Standardized Icon Slot */}
            <div className="w-[56px] shrink-0 flex justify-center items-center">
              <NavIcon
                icon={item.icon}
                className={`h-4.5 w-4.5 ${active ? item.color : 'text-gray-400 group-hover:text-gray-600'}`}
              />
            </div>
            
            {/* Smooth Label Transition */}
            <span 
              className={`
                truncate transition-all duration-300 
                ${sidebarCollapsed ? 'opacity-0 w-0 pointer-events-none' : 'opacity-100 w-auto ml-1'}
              `}
              style={{ paddingLeft: !sidebarCollapsed ? `${depthPadding}px` : '0px' }}
            >
              {item.label}
            </span>
          </div>
          
          {hasChildren && !sidebarCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu(item.href);
              }}
              className="p-1 flex items-center justify-center hover:bg-black/5 rounded-md transition-colors ml-1"
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-gray-400" />
              ) : (
                <ChevronRight size={14} className="text-gray-400" />
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && !sidebarCollapsed && (
          <div className="mt-0.5 space-y-0.5">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Sidebar width classes
  const sidebarWidth = sidebarCollapsed ? 'w-[72px]' : 'w-64';
  const headerJustify = sidebarCollapsed ? 'justify-center' : 'justify-start';
  const footerJustify = sidebarCollapsed ? 'justify-center' : 'justify-start';

  return (
    <aside
      onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
      className={`
        fixed top-0 left-0 bottom-0 ${sidebarWidth} bg-white border-r border-gray-200 z-50
        transform transition-all duration-300 ease-in-out
        md:translate-x-0 overflow-hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${sidebarCollapsed ? 'cursor-pointer hover:bg-gray-50/50' : ''}
      `}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center border-b border-gray-200">
          <div className={`flex items-center min-w-0 px-4 ${headerJustify} w-full overflow-hidden`}>
            <div className="w-[40px] shrink-0 flex justify-center">
              <LayoutDashboard className="h-6 w-6 text-gray-800 shrink-0" />
            </div>
            <span className={`font-bold text-xl text-gray-900 truncate ml-2 transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
              Ramos Admin
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {NAV_ITEMS.map(item => renderNavItem(item))}
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t border-gray-200 space-y-1 ${footerJustify} overflow-hidden`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push('/');
            }}
            className={`
              flex items-center rounded-lg text-sm font-medium
              text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors
              ${sidebarCollapsed ? 'justify-center w-full' : 'w-full justify-start py-2 px-3'}
            `}
          >
            <div className="w-[40px] py-2 shrink-0 flex justify-center">
              <Eye className="h-4 w-4 shrink-0" />
            </div>
            <span className={`transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-3'}`}>
              View Site
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            className={`
              flex items-center rounded-lg text-sm font-medium
              text-red-600 hover:bg-red-50 transition-colors
              ${sidebarCollapsed ? 'justify-center w-full' : 'w-full justify-start py-2 px-3'}
            `}
          >
            <div className="w-[40px] py-2 shrink-0 flex justify-center">
              <LogOut className="h-4 w-4 shrink-0" />
            </div>
            <span className={`transition-all duration-300 overflow-hidden ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto ml-3'}`}>
              Log Out
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
