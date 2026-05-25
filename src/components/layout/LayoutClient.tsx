'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { DockPreferences } from '@/types/about';

/**
 * NonOSChrome (motion + Header + Dock + WindowRenderer + ControlCenter +
 * CalendarPopout) di-lazy load.
 *
 * Manfaat utama:
 * - Homepage `/` (OS desktop) dan semua route admin TIDAK ikut bawa chunk
 *   `motion/react`, `lucide-react/Header`, GlobalDock, WindowRenderer,
 *   ControlCenter, CalendarPopout di initial JS bundle.
 * - Cold-start visitor (mostly hit `/`) dapat HTML + skeleton wallpaper tanpa
 *   menunggu motion/react di-parse.
 * - Route non-OS (mis. `/projects`, `/contact`, `/cv`) tetap dapat chrome
 *   lengkap; chunk-nya di-fetch on-demand setelah hydration.
 *
 * `ssr: false` aman karena chrome ini cuma punya komponen interaktif (dock,
 * window manager). Server tetap render `{children}` dan SEO tidak terdampak.
 */
const NonOSChrome = dynamic(() => import('./NonOSChrome'), {
  ssr: false,
});

export default function LayoutClient({
  children,
  modal,
  dockConfig,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  dockConfig?: DockPreferences;
}) {
  const pathname = usePathname();
  const isAdminRequest = pathname?.startsWith('/admin');
  const isOsMode =
    pathname === '/' || pathname?.startsWith('/about-test') || pathname?.startsWith('/about');

  if (isAdminRequest || isOsMode) {
    return (
      <>
        {children}
        {modal}
      </>
    );
  }

  return (
    <NonOSChrome modal={modal} dockConfig={dockConfig}>
      {children}
    </NonOSChrome>
  );
}
