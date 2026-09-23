'use client';

import React from 'react';
import type { AdminWindowState, AdminDesktopActions } from './types';
import { useAdminWindowJellyDrag } from './window-frame/useAdminWindowJellyDrag';
import { useAdminWindowResize } from './window-frame/useAdminWindowResize';
import { AdminTrafficLights } from './window-frame/AdminTrafficLights';

interface AdminWindowFrameProps {
  state: AdminWindowState;
  actions: AdminDesktopActions;
  children: React.ReactNode;
}

export default function AdminWindowFrame({ state, actions, children }: AdminWindowFrameProps) {
  const { windowRef, handleDragStart } = useAdminWindowJellyDrag({ state, actions });
  const { handleResizeStart } = useAdminWindowResize({ state, actions });

  if (state.isMinimized) return null;

  const Icon = state.icon;
  const isMax = state.isMaximized;

  const style: React.CSSProperties = isMax
    ? { inset: 0, width: '100%', height: '100%', zIndex: state.zIndex }
    : {
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        zIndex: state.zIndex,
      };

  return (
    <div
      ref={windowRef}
      className={`admin-window ${isMax ? 'admin-window-maximized' : ''}`}
      style={style}
      onMouseDown={() => actions.bringToFront(state.id)}
    >
      {/* Title bar */}
      <div className="admin-window-titlebar" onMouseDown={handleDragStart}>
        <AdminTrafficLights
          isMaximized={isMax}
          onClose={() => actions.closeWindow(state.id)}
          onMinimize={() => actions.minimizeWindow(state.id)}
          onToggleMaximize={() => actions.toggleMaximize(state.id)}
        />

        {/* Title center */}
        <div className="admin-window-title">
          <Icon className={`h-4 w-4 ${state.iconColor}`} />
          <span>{state.title}</span>
        </div>

        {/* Spacer for centering */}
        <div className="admin-window-buttons-spacer" />
      </div>

      {/* Content area */}
      <div className="admin-window-content">{children}</div>

      {/* Resize handle */}
      {!isMax && <div className="admin-window-resize-handle" onMouseDown={handleResizeStart} />}
    </div>
  );
}
