'use client';

import React, { useCallback, useRef } from 'react';
import type { AdminWindowState, AdminDesktopActions } from './types';

interface AdminWindowFrameProps {
  state: AdminWindowState;
  actions: AdminDesktopActions;
  children: React.ReactNode;
}

export default function AdminWindowFrame({
  state,
  actions,
  children,
}: AdminWindowFrameProps) {
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const resizeRef = useRef<{
    startX: number;
    startY: number;
    originW: number;
    originH: number;
  } | null>(null);

  // ─── Drag logic ───
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (state.isMaximized) return;
      e.preventDefault();
      actions.bringToFront(state.id);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: state.x,
        originY: state.y,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        actions.updatePosition(
          state.id,
          dragRef.current.originX + dx,
          dragRef.current.originY + dy
        );
      };

      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [state.id, state.x, state.y, state.isMaximized, actions]
  );

  // ─── Resize logic ───
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (state.isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      actions.bringToFront(state.id);
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originW: state.width,
        originH: state.height,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const dx = ev.clientX - resizeRef.current.startX;
        const dy = ev.clientY - resizeRef.current.startY;
        actions.updateSize(
          state.id,
          Math.max(480, resizeRef.current.originW + dx),
          Math.max(320, resizeRef.current.originH + dy)
        );
      };

      const handleUp = () => {
        resizeRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [state.id, state.width, state.height, state.isMaximized, actions]
  );

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
      className={`admin-window ${isMax ? 'admin-window-maximized' : ''}`}
      style={style}
      onMouseDown={() => actions.bringToFront(state.id)}
    >
      {/* Title bar */}
      <div className="admin-window-titlebar" onMouseDown={handleDragStart}>
        {/* macOS traffic light buttons */}
        <div className="admin-window-buttons group">
          <button
            className="admin-window-btn admin-window-btn-close"
            style={{
              width: 12,
              height: 12,
              minWidth: 12,
              minHeight: 12,
              padding: 0,
              border: '1px solid #e0443e',
              background: '#ff5f57',
              borderRadius: '9999px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'transparent',
            }}
            onClick={(e) => {
              e.stopPropagation();
              actions.closeWindow(state.id);
            }}
            title="Tutup"
          >
            <svg
              viewBox="0 0 12 12"
              width={8}
              height={8}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: 'rgba(0,0,0,0.6)' }}
            >
              <path
                d="M3.5 3.5l5 5M8.5 3.5l-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            className="admin-window-btn admin-window-btn-minimize"
            style={{
              width: 12,
              height: 12,
              minWidth: 12,
              minHeight: 12,
              padding: 0,
              border: '1px solid #dda335',
              background: '#febc2e',
              borderRadius: '9999px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'transparent',
            }}
            onClick={(e) => {
              e.stopPropagation();
              actions.minimizeWindow(state.id);
            }}
            title="Minimize"
          >
            <svg
              viewBox="0 0 12 12"
              width={8}
              height={8}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: 'rgba(0,0,0,0.6)' }}
            >
              <path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="admin-window-btn admin-window-btn-maximize"
            style={{
              width: 12,
              height: 12,
              minWidth: 12,
              minHeight: 12,
              padding: 0,
              border: '1px solid #22aa32',
              background: '#28c840',
              borderRadius: '9999px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'transparent',
            }}
            onClick={(e) => {
              e.stopPropagation();
              actions.toggleMaximize(state.id);
            }}
            title={isMax ? 'Restore' : 'Maximize'}
          >
            <svg
              viewBox="0 0 12 12"
              width={8}
              height={8}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: 'rgba(0,0,0,0.6)' }}
            >
              {isMax ? (
                <path
                  d="M3 3l6 6M9 3l-6 6"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <path
                    d="M2 4.5L6 2l4 2.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M2 7.5L6 10l4-2.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Title center */}
        <div className="admin-window-title">
          <Icon className={`h-4 w-4 ${state.iconColor}`} />
          <span>{state.title}</span>
        </div>

        {/* Spacer for centering */}
        <div className="admin-window-buttons-spacer" />
      </div>

      {/* Content area */}
      <div className="admin-window-content">
        {children}
      </div>

      {/* Resize handle */}
      {!isMax && (
        <div
          className="admin-window-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}
