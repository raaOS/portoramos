'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ZoneFolderIconProps {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  gradient: string;
  onOpen: (id: string) => void;
}

export default function ZoneFolderIcon({
  id,
  label,
  description,
  icon: Icon,
  iconBg: _iconBg,
  gradient,
  onOpen,
}: ZoneFolderIconProps) {
  return (
    <button
      className="admin-zone-folder"
      onClick={() => onOpen(id)}
      onDoubleClick={() => onOpen(id)}
    >
      <div className={`admin-zone-folder-icon ${gradient}`}>
        <Icon className="h-10 w-10 text-white" />
      </div>
      <div className="admin-zone-folder-label">{label}</div>
      <div className="admin-zone-folder-desc">{description}</div>
    </button>
  );
}
