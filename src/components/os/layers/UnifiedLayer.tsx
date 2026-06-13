'use client';

import React from 'react';
import { AnimatePresence, m } from 'motion/react';
import OSWindow from '../windows/Window';
import { DraggableStickyNote } from '../ui/elements/DraggableStickyNote';
import type { NoteData } from '../ui/elements/StickyNoteItem';
import { useUnifiedZIndex } from '../context/UnifiedZIndexContext';
import { WindowState } from '@/components/os/hooks/useWindowManager';
import { useOSOverlays, useOSBoot } from '../context/OSSystemContext';

interface MissionTarget {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

interface UnifiedLayerProps {
  windows: WindowState[];
  notes: NoteData[];
  isAdmin: boolean;
  // Window handlers
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  handleWindowResize: (id: string, width: number, height: number) => void;
  handleWindowResizeEnd: (id: string, width: number, height: number) => void;
  togglePin: (id: string) => void;
  // Sticky note handlers
  updateNote: (id: string, updates: Partial<NoteData>) => void;
  bringToFrontNote: (id: string) => void;
  deleteNote: (id: string) => void;
  permanentDeleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  addNote: () => void;
  isRevealed?: boolean;
  windowsReady?: boolean;
  notesReady?: boolean;
  /** Callback when a window is closed */
  onWindowClosed?: (id: string) => void;
  // Mission Control props
  showMissionControl?: boolean;
  missionTargets?: Map<string, MissionTarget>;
  onMissionControlDismiss?: () => void;
}

// Animation variants - only for container fade in
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.18,
    },
  },
};

export default function UnifiedLayer({
  windows,
  notes,
  isAdmin,
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  focusWindow,
  updateWindowPosition,
  handleWindowResize,
  handleWindowResizeEnd,
  togglePin,
  updateNote,
  bringToFrontNote,
  deleteNote,
  permanentDeleteNote,
  restoreNote,
  addNote,
  isRevealed: isRevealedProp,
  windowsReady,
  notesReady,
  onWindowClosed,
  showMissionControl: _showMissionControl,
  missionTargets,
  onMissionControlDismiss,
}: UnifiedLayerProps) {
  const { bringToFront, getZIndex, registerElement, unregisterElement } = useUnifiedZIndex();
  const {
    notesVisible,
    hiddenNoteIds,
    hideNote,
    showMissionControl,
  } = useOSOverlays();
  const { isRevealed: isRevealedFromContext } = useOSBoot();
  const isRevealed = isRevealedProp !== undefined ? isRevealedProp : isRevealedFromContext;
  const canRenderWindows = windowsReady ?? isRevealed;
  const canRenderNotes = notesReady ?? isRevealed;
  const registeredElementIdsRef = React.useRef(new Set<string>());

  // Combine windows and visible notes for unified rendering.
  // Filter out:
  //  - notes yang `isDeleted` (soft-delete persisted, hanya admin yang trigger
  //    via tombol trash di footer note)
  //  - notes yang ada di `hiddenNoteIds` (ephemeral hide via tombol X header,
  //    tidak persist; auto-clear saat user toggle dock icon Notes)
  const visibleNotes = React.useMemo(
    () =>
      showMissionControl
        ? []
        : notesVisible
          ? notes.filter((n) => !n.isDeleted && !hiddenNoteIds.has(n.id))
          : [],
    [hiddenNoteIds, notes, notesVisible, showMissionControl]
  );

  React.useEffect(() => {
    const nextIds = new Set<string>();

    windows.forEach((window) => {
      if (!window.isOpen || window.isMinimized) return;
      nextIds.add(window.id);
      if (!registeredElementIdsRef.current.has(window.id)) {
        registerElement(window.id, 'window', window.zIndex);
      }
    });

    visibleNotes.forEach((note) => {
      nextIds.add(note.id);
      if (!registeredElementIdsRef.current.has(note.id)) {
        registerElement(note.id, 'stickyNote', note.zIndex);
      }
    });

    registeredElementIdsRef.current.forEach((id) => {
      if (!nextIds.has(id)) {
        unregisterElement(id);
      }
    });

    registeredElementIdsRef.current = nextIds;
  }, [registerElement, unregisterElement, visibleNotes, windows]);

  React.useEffect(() => {
    return () => {
      registeredElementIdsRef.current.forEach((id) => unregisterElement(id));
      registeredElementIdsRef.current.clear();
    };
  }, [unregisterElement]);

  // Determine which window is on top for keyboard focus
  const openWindows = windows.filter((w) => w.isOpen && !w.isMinimized);
  const maxWindowZIndex = Math.max(...openWindows.map((w) => getZIndex(w.id)), 0);

  // Handle window focus with unified z-index
  const handleWindowFocus = (id: string) => {
    focusWindow(id);
  };

  // Handle note focus with unified z-index
  const handleNoteFocus = (id: string) => {
    bringToFront(id, 'stickyNote');
    bringToFrontNote(id);
  };

  return (
    <m.div
      data-testid="unified-layer"
      data-notes-visible={notesVisible ? 'true' : 'false'}
      className="pointer-events-none absolute inset-0"
      variants={containerVariants}
      initial="hidden"
      animate={isRevealed ? 'show' : 'hidden'}
    >
      {/* Sticky Notes Layer - Unified with Windows */}
      <AnimatePresence>
        {canRenderNotes &&
          visibleNotes.map((note) => (
            <DraggableStickyNote
              key={`note-${note.id}`}
              note={note}
              updateNote={updateNote}
              bringToFrontNote={() => handleNoteFocus(note.id)}
              deleteNote={deleteNote}
              hideNote={hideNote}
              permanentDeleteNote={permanentDeleteNote}
              restoreNote={restoreNote}
              addNote={addNote}
              isAdmin={isAdmin}
              zIndex={getZIndex(note.id)}
              isRevealed={canRenderNotes}
            />
          ))}
      </AnimatePresence>

      {/* Windows Layer */}
      {canRenderWindows &&
        windows.map((w) => (
          <OSWindow
            key={`window-${w.id}`}
            id={w.id}
            isOpen={w.isOpen}
            title={w.title}
            isMinimized={w.isMinimized}
            isMaximized={w.isMaximized}
            isFocused={w.isOpen && !w.isMinimized && getZIndex(w.id) === maxWindowZIndex}
            onClose={() => {
              closeWindow(w.id);
              onWindowClosed?.(w.id);
            }}
            onMinimize={() => minimizeWindow(w.id)}
            onMaximize={() => maximizeWindow(w.id)}
            onFocus={() => handleWindowFocus(w.id)}
            onUpdatePosition={(x, y) => updateWindowPosition(w.id, x, y)}
            onResize={(width, height) => handleWindowResize(w.id, width, height)}
            onResizeEnd={(width, height) => handleWindowResizeEnd(w.id, width, height)}
            isPinned={isAdmin && w.isPinned}
            onTogglePin={isAdmin ? () => togglePin(w.id) : undefined}
            isAdmin={isAdmin}
            initialPosition={w.initialPosition}
            width={w.width || 800}
            height={w.height || 600}
            zIndex={getZIndex(w.id)}
            noPadding={w.noPadding}
            originRect={w.originRect}
            missionTarget={showMissionControl ? missionTargets?.get(w.id) : null}
            onMissionControlSelect={
              showMissionControl
                ? () => {
                    handleWindowFocus(w.id);
                    onMissionControlDismiss?.();
                  }
                : undefined
            }
          >
            {w.content || (w.contentFactory ? w.contentFactory() : null)}
          </OSWindow>
        ))}
    </m.div>
  );
}
