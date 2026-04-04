'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useAdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '/admin/projects-group': false,
    '/admin/about-group': true,
    '/admin/contact-group': false
  });

  useEffect(() => {
    const isProject = pathname?.startsWith('/admin/projects') || pathname?.startsWith('/admin/sequences');
    const isAbout = pathname?.startsWith('/admin/about') || pathname?.startsWith('/admin/experience') || pathname?.startsWith('/admin/testimonial');
    const isContact = pathname?.startsWith('/admin/contact') || pathname?.startsWith('/admin/leads') || pathname?.startsWith('/admin/telegram');
    const isOSConfig = pathname?.startsWith('/admin/about') && ['desktop', 'dock', 'stickyNotes', 'sounds', 'runningText'].includes(searchParams.get('tab') || '');

    setExpandedMenus(prev => {
      const nextProjects = isProject || prev['/admin/projects-group'];
      const nextAbout = isAbout || prev['/admin/about-group'];
      const nextContact = isContact || prev['/admin/contact-group'];
      const nextOS = isOSConfig || prev['/admin/os-config'];

      if (
        nextProjects !== prev['/admin/projects-group'] ||
        nextAbout !== prev['/admin/about-group'] ||
        nextContact !== prev['/admin/contact-group'] ||
        nextOS !== prev['/admin/os-config']
      ) {
        return {
          ...prev,
          '/admin/projects-group': nextProjects,
          '/admin/about-group': nextAbout,
          '/admin/contact-group': nextContact,
          '/admin/os-config': nextOS
        };
      }
      return prev;
    });
  }, [pathname, searchParams]);

  const toggleMenu = useCallback((href: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
  }, []);

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
    expandedMenus,
    toggleMenu,
    isActive
  };
}
