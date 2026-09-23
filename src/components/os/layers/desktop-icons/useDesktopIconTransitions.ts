'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { WindowState } from '../../hooks/useWindowManager';
import type { Project } from '@/types/projects';

interface UseDesktopIconTransitionsOptions {
  windows: WindowState[];
  openProjectWindow: (
    project: Project,
    originRect?: { x: number; y: number; width: number; height: number }
  ) => void;
}

export function useDesktopIconTransitions({
  windows,
  openProjectWindow,
}: UseDesktopIconTransitionsOptions) {
  const [openingIconId, setOpeningIconId] = useState<string | null>(null);
  const [closingToIconId, setClosingToIconId] = useState<string | null>(null);

  const prevWindowsRef = useRef(windows);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevWindowsRef.current;
    const curr = windows;

    for (const currW of curr) {
      if (!currW.id.startsWith('project-')) continue;
      const prevW = prev.find((w) => w.id === currW.id);
      if (!prevW) continue;

      const justClosed = prevW.isOpen && !currW.isOpen;
      const justMinimized = !prevW.isMinimized && currW.isMinimized;

      if (justClosed || justMinimized) {
        const projectId = currW.id.replace('project-', '');
        setClosingToIconId(projectId);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => {
          closeTimeoutRef.current = null;
          setClosingToIconId(null);
        }, 700);
        break;
      }
    }

    prevWindowsRef.current = curr;
  }, [windows]);

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const triggerOpenProject = useCallback(
    (
      iconId: string,
      project: Project,
      rect?: { x: number; y: number; width: number; height: number }
    ) => {
      setOpeningIconId(iconId);
      openProjectWindow(project, rect);

      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = setTimeout(() => {
        openTimeoutRef.current = null;
        setOpeningIconId(null);
      }, 700);
    },
    [openProjectWindow]
  );

  return {
    openingIconId,
    closingToIconId,
    triggerOpenProject,
  };
}
