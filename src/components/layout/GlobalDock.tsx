'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { m } from 'framer-motion';
import Dock from '@/app/about/_components/os/core/Dock';
import AppIcon from '@/app/about/_components/os/ui/AppIcon';
import WhatsAppIcon from '@/app/about/_components/os/ui/WhatsAppIcon';
import { useWindowContext } from '@/contexts/WindowContext';
import { Grid, User, Mail, FileText, Trash2 } from 'lucide-react';
import { getDockItemConfig } from '@/app/about/_components/os/utils/dockUtils';
import type { DockPreferences } from '@/types/about';

export default function GlobalDock({ dockConfig }: { dockConfig?: DockPreferences }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isWindowOpen, bouncingDocId } = useWindowContext();
  
  // BUG FIX: Add mounted state to prevent flash during initial render
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure smooth transition from OS dock
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAppLaunch = React.useCallback((appId: string) => {
    router.push(`/?app=${appId}`);
  }, [router]);

  const dockItems = useMemo(() => {
    const defaultItems = [
      {
        id: "projects",
        label: "Projects",
        icon: <AppIcon icon={Grid} color="from-zinc-700 to-zinc-900" />,
        onClick: () => router.push('/projects')
      },
      {
        id: "about",
        label: "About Me",
        icon: <AppIcon icon={User} color="from-gray-300 to-gray-400" />,
        onClick: () => handleAppLaunch('about'),
        isOpen: isWindowOpen('about')
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        icon: <WhatsAppIcon />,
        onClick: () => handleAppLaunch('whatsapp'),
        isOpen: isWindowOpen('whatsapp')
      },
      {
        id: "contact",
        label: "Contact",
        icon: <AppIcon icon={Mail} color="from-blue-400 to-indigo-500" />,
        onClick: () => router.push('/contact')
      },
      {
        id: "notes",
        label: "Notes",
        icon: <AppIcon icon={FileText} color="from-yellow-300 to-orange-400" />,
        onClick: () => handleAppLaunch('notes'),
        isOpen: isWindowOpen('notes')
      },
      {
        id: "trash",
        label: "Trash",
        icon: <AppIcon icon={Trash2} color="from-gray-400 to-gray-500" />,
        onClick: () => handleAppLaunch('trash-bin'),
        isOpen: isWindowOpen('trash-bin')
      },
    ];

    return getDockItemConfig(defaultItems, dockConfig);
  }, [router, isWindowOpen, dockConfig, handleAppLaunch]);

  // Don't render on admin, home (OS desktop has its own), or about pages
  if (pathname?.startsWith('/admin') || pathname === '/' || pathname?.startsWith('/about')) {
    return null;
  }

  // BUG FIX: Don't render until mounted to prevent flash
  if (!isMounted) {
    return null;
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Dock
        items={dockItems}
        bouncingId={bouncingDocId}
      />
    </m.div>
  );
}