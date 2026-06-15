'use client';

import React from 'react';
import { ADMIN_ZONES } from './registry';
import type { AdminDesktopActions, AdminWindowState } from './types';
import AdminMenuBar from './AdminMenuBar';
import ZoneFolderIcon from './ZoneFolderIcon';
import FolderWindow from './FolderWindow';
import AdminWindowFrame from './AdminWindowFrame';
import WindowContentRenderer from './WindowContentRenderer';
import AdminTaskbar from './AdminTaskbar';
import './admin-desktop.css';

interface AdminDesktopShellProps {
  windows: AdminWindowState[];
  openFolderId: string | null;
  actions: AdminDesktopActions;
  onLogout: () => Promise<void>;
}

export default function AdminDesktopShell({
  windows,
  openFolderId,
  actions,
  onLogout,
}: AdminDesktopShellProps) {
  const openZone = openFolderId ? ADMIN_ZONES.find((z) => z.id === openFolderId) : null;

  return (
    <div className="admin-desktop">
      <div className="admin-desktop-wallpaper" />

      {/* Top Menu Bar */}
      <AdminMenuBar onLogout={onLogout} />

      {/* Desktop Zone Folder Icons */}
      <div className="admin-desktop-zones">
        {ADMIN_ZONES.map((zone) => (
          <ZoneFolderIcon
            key={zone.id}
            id={zone.id}
            label={zone.label}
            description={zone.description}
            icon={zone.icon}
            iconBg={zone.iconBg}
            gradient={zone.gradient}
            onOpen={actions.openFolder}
          />
        ))}
      </div>

      {/* Folder Window Overlay */}
      {openZone && <FolderWindow zone={openZone} actions={actions} />}

      {/* Active CRUD Windows */}
      {windows.map((win) => (
        <AdminWindowFrame key={win.id} state={win} actions={actions}>
          <WindowContentRenderer appId={win.appId} />
        </AdminWindowFrame>
      ))}

      {/* Bottom Taskbar */}
      <AdminTaskbar windows={windows} actions={actions} />
    </div>
  );
}
