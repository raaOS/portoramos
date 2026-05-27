'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { AdminZone, AdminDesktopActions } from './types';

interface FolderWindowProps {
  zone: AdminZone;
  actions: AdminDesktopActions;
}

export default function FolderWindow({ zone, actions }: FolderWindowProps) {
  return (
    <div className="admin-folder-overlay" onClick={() => actions.closeFolder()}>
      <div
        className="admin-folder-window"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Folder title bar */}
        <div className={`admin-folder-titlebar ${zone.gradient}`}>
          <div className="flex items-center gap-2">
            <zone.icon className="h-5 w-5 text-white" />
            <span className="font-semibold text-white">{zone.label}</span>
          </div>
          <button
            onClick={() => actions.closeFolder()}
            className="admin-folder-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* App grid */}
        <div className="admin-folder-grid">
          {zone.apps.map((app) => (
            <button
              key={app.id}
              className="admin-folder-app"
              onClick={() => {
                actions.openApp(zone.id, app.id);
                actions.closeFolder();
              }}
            >
              <div className={`admin-folder-app-icon ${app.iconBg}`}>
                <app.icon className={`h-7 w-7 ${app.iconColor}`} />
              </div>
              <span className="admin-folder-app-label">{app.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
