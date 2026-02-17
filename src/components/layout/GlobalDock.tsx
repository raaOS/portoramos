'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Dock from '@/app/about/_components/os/Dock';
import AppIcon from '@/app/about/_components/os/ui/AppIcon';
import { useWindowContext } from '@/contexts/WindowContext';
import { Grid, User, Mail, FileText, Trash2, MessageCircle } from 'lucide-react';
import { getDockItemConfig } from '@/app/about/_components/os/utils/dockUtils';

// Note: Window content is created inline in the handlers below

interface GlobalDockProps {
  className?: string;
}

export default function GlobalDock({ className, dockConfig }: { className?: string; dockConfig?: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isWindowOpen, bouncingDocId } = useWindowContext();

  const handleAppLaunch = (appId: string) => {
    // If we are already on the desktop (shouldn't happen given the check below, but for safety)
    if (pathname === '/') {
      // Just open the window via context? No, GlobalDock shouldn't be valid here.
      return;
    }

    // Redirect to home with app query param to auto-open
    router.push(`/?app=${appId}`);
  };

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
        icon: <AppIcon icon={MessageCircle} color="from-green-500 to-emerald-600" />,
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

    // Apply custom configuration from DB (labels, hidden status, custom icons)
    return getDockItemConfig(defaultItems, dockConfig);
  }, [router, isWindowOpen, dockConfig]);

  // Jangan tampilkan dock di halaman admin atau halaman about (yang sudah punya dock sendiri)
  if (pathname?.startsWith('/admin') || pathname === '/' || pathname?.startsWith('/about')) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto ${className || ''}`}>
      <Dock
        items={dockItems}
        bouncingId={bouncingDocId}
      />
    </div>
  );
}