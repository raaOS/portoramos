'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Dock from './Dock';
import AppIcon from "../ui/AppIcon";
import { getDockItemConfig } from "../utils/dockUtils";
import { AboutData } from '@/types/about';
import { Project } from '@/types/projects';
import { Grid, User, Mail, FileText, Trash2 } from 'lucide-react';
import WhatsAppIcon from "../ui/WhatsAppIcon";
import DockProjectModes from '../ui/DockProjectModes';

interface OSDockProps {
  aboutData?: AboutData;
  onOpenWindow: (windowId: string) => void;
  onOpenWhatsApp: () => void;
  onOpenContact: () => void;
  onOpenNotes: () => void;
  onOpenTrash: () => void;
  isWindowOpen: (windowId: string) => boolean;
  notesVisible: boolean;
  bouncingId?: string | null;
  className?: string;
  isMobile?: boolean;
  commercialProjects?: Project[];
  openProjectWindow?: (project: Project) => void;
}

export default function OSDock({
  aboutData,
  onOpenWindow,
  onOpenWhatsApp,
  onOpenContact,
  onOpenNotes,
  onOpenTrash,
  isWindowOpen,
  notesVisible,
  bouncingId,
  className,
  isMobile = false,
}: OSDockProps) {
  const router = useRouter();
  const handleOpenProjects = useCallback(() => {
    router.push('/projects');
  }, [router]);

  const dockItems = useMemo(() => {
    const defaultItems = [
      {
        id: "projects",
        label: "Projects",
        icon: <AppIcon icon={Grid} color="from-zinc-700 to-zinc-900" />,
        onClick: handleOpenProjects,
        popoverContent: <DockProjectModes />
      },
      { id: "about", label: "About Me", icon: <AppIcon icon={User} color="from-gray-300 to-gray-400" />, onClick: () => onOpenWindow("about"), isOpen: isWindowOpen("about") },
      { id: "whatsapp", label: "WhatsApp", icon: <WhatsAppIcon />, onClick: onOpenWhatsApp, isOpen: isWindowOpen("whatsapp") },
      { id: "contact", label: "Contact", icon: <AppIcon icon={Mail} color="from-blue-400 to-indigo-500" />, onClick: onOpenContact, isOpen: isWindowOpen("contact") },
      { id: "notes", label: "Notes", icon: <AppIcon icon={FileText} color="from-yellow-300 to-orange-400" />, onClick: onOpenNotes, isOpen: notesVisible },
      { id: "trash", label: "Trash", icon: <AppIcon icon={Trash2} color="from-gray-400 to-gray-500" />, onClick: onOpenTrash, isOpen: isWindowOpen("trash-bin") },
    ];

    return getDockItemConfig(defaultItems, aboutData?.dockConfig);
  }, [aboutData?.dockConfig, handleOpenProjects, onOpenWindow, onOpenWhatsApp, onOpenContact, onOpenNotes, onOpenTrash, isWindowOpen, notesVisible]);

  return (
    <div className={className}>
      <Dock items={dockItems} bouncingId={bouncingId} isMobile={isMobile} />
    </div>
  );
}
