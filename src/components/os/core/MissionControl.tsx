'use client';

import React from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useOSOverlays } from '../context/OSSystemContext';
import { useDesktopWindowContext } from '../context/DesktopWindowContext';

export default function MissionControl() {
  const { showMissionControl, setShowMissionControl } = useOSOverlays();
  const { windows, focusWindow } = useDesktopWindowContext();

  const openWindows = windows.filter((w) => w.isOpen && !w.isMinimized);

  const handleWindowSelect = React.useCallback(
    (id: string) => {
      focusWindow(id);
      setShowMissionControl(false);
    },
    [focusWindow, setShowMissionControl]
  );

  return (
    <AnimatePresence>
      {showMissionControl && (
        <m.div
          key="mission-control-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-none fixed inset-0 z-[60]"
        >
          {/* Visual backdrop only — no click handling */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Floating labels bar at the bottom for selection */}
          <div className="pointer-events-auto absolute bottom-28 left-1/2 -translate-x-1/2">
            {openWindows.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                {openWindows.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleWindowSelect(w.id)}
                    className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl px-3 py-2 transition-colors hover:bg-white/10"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-sm font-semibold text-white">
                      {w.title.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[110px] truncate text-center text-[11px] font-medium text-white/70">
                      {w.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hint */}
          <div className="pointer-events-none absolute bottom-[72px] left-1/2 -translate-x-1/2">
            <span className="text-[11px] text-white/35">F3 or Esc to dismiss</span>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
