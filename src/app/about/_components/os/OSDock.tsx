'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Dock from './Dock';
import AppIcon from './ui/AppIcon';
import { getDockItemConfig } from './utils/dockUtils';
import { AboutData } from '@/types/about';
import { Grid, User, Mail, FileText, Trash2 } from 'lucide-react';
import WhatsAppIcon from './ui/WhatsAppIcon';

interface OSDockProps {
  aboutData?: AboutData;
  onOpenWindow: (windowId: string) => void;
  onOpenNotes: () => void;
  onOpenTrash: () => void;
  isWindowOpen: (windowId: string) => boolean;
  notesVisible: boolean;
  bouncingId?: string | null;
  className?: string;
  isMobile?: boolean;
}

export default function OSDock({
  aboutData,
  onOpenWindow,
  onOpenNotes,
  onOpenTrash,
  isWindowOpen,
  notesVisible,
  bouncingId,
  className,
  isMobile = false
}: OSDockProps) {
  const router = useRouter();

  const dockItems = useMemo(() => {
    const defaultItems = [
      { id: "projects", label: "Projects", icon: <AppIcon icon={Grid} color="from-zinc-700 to-zinc-900" />, onClick: () => router.push('/projects') },
      { id: "about", label: "About Me", icon: <AppIcon icon={User} color="from-gray-300 to-gray-400" />, onClick: () => onOpenWindow("about"), isOpen: isWindowOpen("about") },
      { id: "whatsapp", label: "WhatsApp", icon: <WhatsAppIcon />, onClick: () => onOpenWindow("whatsapp"), isOpen: isWindowOpen("whatsapp") },
      { id: "contact", label: "Contact", icon: <AppIcon icon={Mail} color="from-blue-400 to-indigo-500" />, onClick: () => router.push('/contact') },
      { id: "notes", label: "Notes", icon: <AppIcon icon={FileText} color="from-yellow-300 to-orange-400" />, onClick: onOpenNotes, isOpen: notesVisible },
      { id: "trash", label: "Trash", icon: <AppIcon icon={Trash2} color="from-gray-400 to-gray-500" />, onClick: onOpenTrash, isOpen: isWindowOpen("trash-bin") },
    ];

    return getDockItemConfig(defaultItems, aboutData?.dockConfig);
  }, [router, aboutData?.dockConfig, onOpenWindow, onOpenNotes, onOpenTrash, isWindowOpen, notesVisible]);

  return (
    <div className={className}>
      <Dock items={dockItems} bouncingId={bouncingId} isMobile={isMobile} />
    </div>
  );
}