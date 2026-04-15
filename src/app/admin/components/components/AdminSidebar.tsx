'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Eye, LogOut, ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { NAV_ITEMS, type NavItem } from '../AdminConstants';

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

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.href];

    // When collapsed, hide text, children, and chevron
    const showChevron = hasChildren && !sidebarCollapsed;

    return (
      <div key={item.href} className="mb-0.5">
        <div
          className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${active && !hasChildren ? 'bg-blue-50 text-blue-700 shadow-sm' : `text-gray-600 ${item.bg} hover:text-gray-900`
            }`}
          style={{ paddingLeft: `${12 + (depth * 12)}px` }}
          onClick={() => {
            const isVirtualGroup = item.href.endsWith('-group') || item.href === '/admin/os-config';
            if (!isVirtualGroup) {
              router.push(item.href);
            }
            if (hasChildren && !sidebarCollapsed) toggleMenu(item.href);
            setIsMobileMenuOpen(false);
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <NavIcon
              icon={item.icon}
              className={`h-4.5 w-4.5 shrink-0 ${active ? item.color : 'text-gray-400 group-hover:text-gray-600'}`}
            />
            <span className={`truncate transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{item.label}</span>
          </div>
          {showChevron && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMenu(item.href);
              }}
              className="p-1 flex items-center justify-center hover:bg-black/5 rounded-md transition-colors"
            >
              {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
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

  return (
    <aside
      onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
      className={`fixed top-0 left-0 bottom-0 ${sidebarCollapsed ? 'w-[72px]' : 'w-64'} bg-white border-r border-gray-200 z-50 transform transition-[width] duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} cursor-pointer`}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center border-b border-gray-200 overflow-hidden">
          <div className={`${sidebarCollapsed ? 'w-[72px] justify-center' : 'px-6'} flex items-center min-w-0`}>
            <LayoutDashboard className="h-6 w-6 text-gray-800 shrink-0" />
            <span className={`font-bold text-xl text-gray-900 truncate transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 ml-2'}`}>
              Ramos Admin
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_ITEMS.map(item => renderNavItem(item))}
        </nav>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t border-gray-200 space-y-1 ${sidebarCollapsed ? 'px-2' : ''}`}>
          <button
            onClick={() => router.push('/')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span className={`transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>View Site</span>
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className={`transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
