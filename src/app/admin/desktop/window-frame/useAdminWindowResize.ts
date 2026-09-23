'use client';

import { useCallback, useRef, useEffect } from 'react';
import type { AdminWindowState, AdminDesktopActions } from '../types';

interface UseAdminWindowResizeOptions {
  state: AdminWindowState;
  actions: AdminDesktopActions;
}

export function useAdminWindowResize({ state, actions }: UseAdminWindowResizeOptions) {
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    originW: number;
    originH: number;
  } | null>(null);

  const resizeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      resizeCleanupRef.current?.();
    };
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (state.isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      actions.bringToFront(state.id);
      resizeCleanupRef.current?.();
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

      const cleanupResize = () => {
        resizeRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', cleanupResize);
        resizeCleanupRef.current = null;
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', cleanupResize);
      resizeCleanupRef.current = cleanupResize;
    },
    [state.id, state.width, state.height, state.isMaximized, actions]
  );

  return {
    handleResizeStart,
  };
}
