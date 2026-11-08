'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { WindowState } from '../../hooks/useWindowManager';
import type { Project } from '@/types/projects';

// Durasi pulse ikon HARUS sinkron dengan durasi morph jendela (Window.tsx):
// - close: iconMorphCloseTransition ~0.28s → pulse ikon 340ms (ikon kembali
//   normal tepat saat jendela selesai mengecil; dulu 700ms → ikon "menggantung"
//   kecil ~0.4s tanpa jendela).
// - open: settle x/y jendela 0.34s → pulse ikon 450ms (dulu 700ms, lebih lama
//   dari pantulan spring jendela sehingga terasa tidak sinkron).
const OPEN_ICON_PULSE_MS = 450;
const CLOSE_ICON_PULSE_MS = 340;

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
  // Set (bukan single state) — klik 2 ikon beruntun tidak saling menimpa.
  const [openingIconIds, setOpeningIconIds] = useState<Set<string>>(new Set());
  const [closingIconIds, setClosingIconIds] = useState<Set<string>>(new Set());

  const prevWindowsRef = useRef(windows);
  const openTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const closeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const prev = prevWindowsRef.current;
    const curr = windows;
    const newlyClosed: string[] = [];

    for (const currW of curr) {
      if (!currW.id.startsWith('project-')) continue;
      const prevW = prev.find((w) => w.id === currW.id);
      if (!prevW) continue;

      const justClosed = prevW.isOpen && !currW.isOpen;
      const justMinimized = !prevW.isMinimized && currW.isMinimized;

      // Hanya animasikan ikon jika jendela memang punya originRect (dibuka dari
      // ikon). Jendela dari Spotlight/restore tidak morph ke ikon — jangan
      // animasikan ikon yang salah sasaran. Tanpa `break`: menutup beberapa
      // jendela sekaligus tetap menganimasikan semua ikonnya.
      if ((justClosed || justMinimized) && currW.originRect) {
        newlyClosed.push(currW.id.replace('project-', ''));
      }
    }

    if (newlyClosed.length > 0) {
      // Microtask, bukan setState sinkron di body effect (react-hooks/
      // set-state-in-effect): diff prev/curr windows tetap di effect, tapi
      // update state-nya dijadwalkan setelah commit selesai.
      queueMicrotask(() => {
        setClosingIconIds((prevSet) => {
          const next = new Set(prevSet);
          newlyClosed.forEach((id) => next.add(id));
          return next;
        });
        newlyClosed.forEach((id) => {
          const existing = closeTimersRef.current.get(id);
          if (existing) clearTimeout(existing);
          closeTimersRef.current.set(
            id,
            setTimeout(() => {
              closeTimersRef.current.delete(id);
              setClosingIconIds((prevSet) => {
                const next = new Set(prevSet);
                next.delete(id);
                return next;
              });
            }, CLOSE_ICON_PULSE_MS)
          );
        });
      });
    }

    prevWindowsRef.current = curr;
  }, [windows]);

  useEffect(() => {
    // Copy Map ke variabel lokal agar cleanup memakai instance yang sama
    // dengan saat effect ini dipasang (react-hooks/exhaustive-deps).
    const openTimers = openTimersRef.current;
    const closeTimers = closeTimersRef.current;
    return () => {
      openTimers.forEach((t) => clearTimeout(t));
      closeTimers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const triggerOpenProject = useCallback(
    (
      iconId: string,
      project: Project,
      rect?: { x: number; y: number; width: number; height: number }
    ) => {
      const windowId = `project-${project.id}`;
      const alreadyOpen = windows.some((w) => w.id === windowId && w.isOpen && !w.isMinimized);

      // openWindow idempotent: kalau sudah terbuka hanya re-focus (bawa ke depan)
      // TANPA animasi ikon palsu (dulu ikon membesar 1.15 padahal jendela diam).
      openProjectWindow(project, rect);
      if (alreadyOpen) return;

      setOpeningIconIds((prevSet) => {
        const next = new Set(prevSet);
        next.add(iconId);
        return next;
      });

      const existing = openTimersRef.current.get(iconId);
      if (existing) clearTimeout(existing);
      openTimersRef.current.set(
        iconId,
        setTimeout(() => {
          openTimersRef.current.delete(iconId);
          setOpeningIconIds((prevSet) => {
            const next = new Set(prevSet);
            next.delete(iconId);
            return next;
          });
        }, OPEN_ICON_PULSE_MS)
      );
    },
    [openProjectWindow, windows]
  );

  return {
    openingIconIds,
    closingIconIds,
    triggerOpenProject,
  };
}
