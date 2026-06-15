'use client';

import React from 'react';
import type { AdminWindowState, AdminDesktopActions } from './types';

interface AdminTaskbarProps {
  windows: AdminWindowState[];
  actions: AdminDesktopActions;
}

export default function AdminTaskbar({ windows, actions }: AdminTaskbarProps) {
  if (windows.length === 0) return null;

  return (
    <div className="admin-taskbar">
      <div className="admin-taskbar-inner">
        {windows.map((w) => {
          const Icon = w.icon;
          return (
            <button
              key={w.id}
              className={`admin-taskbar-item ${
                w.isMinimized ? 'admin-taskbar-item-minimized' : ''
              }`}
              onClick={() => actions.bringToFront(w.id)}
              title={w.title}
            >
              <Icon className={`h-4 w-4 ${w.iconColor}`} />
              <span className="admin-taskbar-item-label">{w.title}</span>
              {w.isMinimized && <span className="admin-taskbar-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
