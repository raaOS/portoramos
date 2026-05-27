'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AboutData, DesktopIconPosition } from '@/types/about';
import { getIconPosition, saveIconPosition, loadPositions } from '../utils/positionSync';
import { useLayoutPersistence } from '../contexts/LayoutPersistenceContext';

interface UseDesktopLayoutProps {
  aboutData?: AboutData | null;
  isAdmin: boolean;
  csrfToken: string | null;
}

export function useDesktopLayout({ aboutData, isAdmin, csrfToken }: UseDesktopLayoutProps) {
  const { registerFlush, unregisterFlush } = useLayoutPersistence();

  // Admin localStorage / in-session drags are overrides. Cloudflare D1 remains
  // a derived template, so aboutData changes do not require render-phase setState.
  const [iconPositionOverrides, setIconPositionOverrides] = useState<
    Record<string, DesktopIconPosition>
  >(() => (isAdmin ? loadPositions().icons || {} : {}));

  const iconPositions = useMemo(() => {
    const cloudIconPositions = aboutData?.desktopPreferences?.iconPositions || {};
    const persistedAdminPositions = isAdmin ? loadPositions().icons || {} : {};
    return { ...cloudIconPositions, ...persistedAdminPositions, ...iconPositionOverrides };
  }, [aboutData?.desktopPreferences?.iconPositions, iconPositionOverrides, isAdmin]);

  const handleIconPositionChange = useCallback(
    (id: string, x: number, y: number) => {
      // Update state (untuk semua agar responsif)
      const vp =
        typeof window !== 'undefined'
          ? { width: window.innerWidth, height: window.innerHeight }
          : { width: 1440, height: 900 };

      const updated: DesktopIconPosition = {
        x,
        y,
        xPct: vp.width > 0 ? (x / vp.width) * 100 : 0,
        yPct: vp.height > 0 ? (y / vp.height) * 100 : 0,
        refScreenWidth: vp.width,
        refScreenHeight: vp.height,
      };

      setIconPositionOverrides((prev) => ({ ...prev, [id]: updated }));

      // Save ke positionSync (localStorage untuk admin, no-op untuk visitor)
      saveIconPosition(id, { x, y }, isAdmin);
    },
    [isAdmin]
  );

  const getIconPos = useCallback(
    (id: string, defaultX: number, defaultY: number) => {
      const saved = iconPositions[id];
      if (saved) return { x: saved.x, y: saved.y };
      return getIconPosition(id, null, { x: defaultX, y: defaultY }, isAdmin);
    },
    [iconPositions, isAdmin]
  );

  // Flush Icons to Server (Admin only)
  const flushIcons = useCallback(async () => {
    if (!isAdmin || !csrfToken) return;
    try {
      const { flushPositions } = await import('../utils/positionSync');
      await flushPositions(csrfToken);
    } catch (error) {
      console.error('[DesktopLayout] Failed to flush icons:', error);
    }
  }, [isAdmin, csrfToken]);

  useEffect(() => {
    registerFlush('desktopIcons', flushIcons);
    return () => unregisterFlush('desktopIcons');
  }, [registerFlush, unregisterFlush, flushIcons]);

  return {
    iconPositions,
    setIconPositions: setIconPositionOverrides,
    handleIconPositionChange,
    getIconPos,
  };
}
