'use client';

import { useState, useMemo, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type AdminMenuKey =
  | '/admin/projects-group'
  | '/admin/about-group'
  | '/admin/contact-group'
  | '/admin/os-config';

export function useAdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [manualExpandedMenus, setManualExpandedMenus] = useState<Record<string, boolean>>({
    '/admin/projects-group': false,
    '/admin/about-group': true,
    '/admin/contact-group': false,
    '/admin/os-config': false
  });

  const routeExpandedMenus = useMemo(() => {
    const isProject = pathname?.startsWith('/admin/projects');
    const isAbout = pathname?.startsWith('/admin/about') || pathname?.startsWith('/admin/experience') || pathname?.startsWith('/admin/testimonial');
    const isContact = pathname?.startsWith('/admin/contact') || pathname?.startsWith('/admin/leads') || pathname?.startsWith('/admin/telegram');
    const isOSConfig = pathname?.startsWith('/admin/about') && ['desktop', 'dock', 'stickyNotes', 'sounds', 'runningText'].includes(searchParams.get('tab') || '');

    return {
      '/admin/projects-group': isProject,
      '/admin/about-group': isAbout,
      '/admin/contact-group': isContact,
      '/admin/os-config': isOSConfig
    };
  }, [pathname, searchParams]);

  const expandedMenus = useMemo(() => ({
    '/admin/projects-group': routeExpandedMenus['/admin/projects-group'] || manualExpandedMenus['/admin/projects-group'],
    '/admin/about-group': routeExpandedMenus['/admin/about-group'] || manualExpandedMenus['/admin/about-group'],
    '/admin/contact-group': routeExpandedMenus['/admin/contact-group'] || manualExpandedMenus['/admin/contact-group'],
    '/admin/os-config': routeExpandedMenus['/admin/os-config'] || manualExpandedMenus['/admin/os-config']
  }), [manualExpandedMenus, routeExpandedMenus]);

  const toggleMenu = useCallback((href: string) => {
    const key = href as AdminMenuKey;
    setManualExpandedMenus(prev => ({
      ...prev,
      [key]: !(routeExpandedMenus[key] || prev[key])
    }));
  }, [routeExpandedMenus]);

  const isActive = useCallback((href: string) => {
    if (href === '/admin') return pathname === '/admin';

    if (href.includes('?')) {
      const [path, query] = href.split('?');
      const tab = query.split('=')[1];
      return pathname === path && searchParams.get('tab') === tab;
    }

    return pathname?.startsWith(href);
  }, [pathname, searchParams]);

  return {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    expandedMenus,
    toggleMenu,
    isActive
  };
}
