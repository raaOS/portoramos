"use client";

import React from "react";
import { m } from "motion/react";
import OSWindow from "../windows/Window";
import { DraggableStickyNote } from "../ui/elements/DraggableStickyNote";
import type { NoteData } from "../ui/elements/StickyNoteItem";
import { useUnifiedZIndex } from "../context/UnifiedZIndexContext";
import { WindowState } from "@/hooks/useWindowManager";
import { useOSSystem } from "../context/OSSystemContext";

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
}

// Animation variants - only for container fade in
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3,
      delay: 0.28,
    }
  }
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
}: UnifiedLayerProps) {
  const { bringToFront, getZIndex } = useUnifiedZIndex();
  const { notesVisible, isRevealed: isRevealedFromContext } = useOSSystem();
  const isRevealed = isRevealedProp !== undefined ? isRevealedProp : isRevealedFromContext;

  // Determine which window is on top for keyboard focus
  const openWindows = windows.filter(w => w.isOpen && !w.isMinimized);
  const maxWindowZIndex = Math.max(...openWindows.map(w => getZIndex(w.id)), 0);

  // Handle window focus with unified z-index
  const handleWindowFocus = (id: string) => {
    const newZIndex = bringToFront(id, 'window');
    // Also call the original focus handler for any side effects
    focusWindow(id);
    return newZIndex;
  };

  // Handle note focus with unified z-index
  const handleNoteFocus = (id: string) => {
    const newZIndex = bringToFront(id, 'stickyNote');
    // Also call the original bringToFront
    bringToFrontNote(id);
    return newZIndex;
  };

  // Combine windows and visible notes for unified rendering
  // Filter out deleted notes
  const visibleNotes = notesVisible ? notes.filter(n => !n.isDeleted) : [];

  return (
    <m.div
      className="absolute inset-0 pointer-events-none"
      variants={containerVariants}
      initial="hidden"
      animate={isRevealed ? "show" : "hidden"}
    >
      {/* Windows Layer */}
      {windows.map((w) => (
          <OSWindow
            key={`window-${w.id}`}
            id={w.id}
            isOpen={w.isOpen}
            title={w.title}
            isMinimized={w.isMinimized}
            isMaximized={w.isMaximized}
            isFocused={w.isOpen && !w.isMinimized && getZIndex(w.id) === maxWindowZIndex}
            onClose={() => closeWindow(w.id)}
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
          >
            {w.content || (w.contentFactory ? w.contentFactory() : null)}
          </OSWindow>
      ))}

      {/* Sticky Notes Layer - Unified with Windows */}
      {visibleNotes.map((note) => (
        <div
          key={`note-${note.id}`}
          className="pointer-events-none"
          style={{
            position: 'absolute',
            zIndex: getZIndex(note.id),
            willChange: 'auto',
          }}
        >
          <DraggableStickyNote
            note={note}
            updateNote={updateNote}
            bringToFrontNote={() => handleNoteFocus(note.id)}
            deleteNote={deleteNote}
            permanentDeleteNote={permanentDeleteNote}
            restoreNote={restoreNote}
            addNote={addNote}
            isAdmin={isAdmin}
            zIndex={getZIndex(note.id)}
          />
        </div>
      ))}
    </m.div>
  );
}
