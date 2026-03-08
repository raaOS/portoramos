import React from "react";
import { m, useDragControls } from "framer-motion";
import StickyNoteItem, { NoteData } from "./StickyNoteItem";
import { useUnifiedZIndex } from "../../context/UnifiedZIndexContext";

interface DraggableStickyNoteProps {
    note: NoteData;
    updateNote: (id: string, updates: Partial<NoteData>) => void;
    bringToFrontNote: (id: string) => void;
    deleteNote: (id: string) => void;
    permanentDeleteNote: (id: string) => void;
    restoreNote: (id: string) => void;
    addNote?: () => void;
    isAdmin?: boolean;
    zIndex?: number;
}

export const DraggableStickyNote = ({
    note,
    updateNote,
    bringToFrontNote,
    deleteNote,
    permanentDeleteNote,
    restoreNote,
    addNote,
    isAdmin = false
}: DraggableStickyNoteProps) => {
    const dragControls = useDragControls();
    const { getZIndex, bringToFront } = useUnifiedZIndex();

    // Unified bring to front handler
    const handleBringToFront = React.useCallback(() => {
        // Register this note with unified z-index system
        bringToFront(note.id, 'stickyNote');
        // Also call the parent's handler for any side effects
        bringToFrontNote(note.id);
    }, [note.id, bringToFront, bringToFrontNote]);

    // Get z-index from unified system (fallback to note's stored z-index)
    const unifiedZIndex = getZIndex(note.id) || note.zIndex || 1;
    // Pinned notes get a small boost but still participate in unified stacking
    const finalZIndex = note.isPinned ? Math.max(unifiedZIndex, 5000) : unifiedZIndex;

    return (
        <m.div
            key={note.id}
            drag={!note.isPinned}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            data-lenis-prevent
            animate={note.isDeleted ? { opacity: 0, scale: 0.8 } : "show"}
            initial="hidden"
            variants={{
                hidden: {
                    opacity: 0,
                    scale: 0.8,
                    y: note.y || 100, // No extra drop here, parent handles it
                    x: note.x || 100
                },
                show: {
                    opacity: note.opacity || 1,
                    scale: 1,
                    y: note.y || 100,
                    x: note.x || 100,
                    transition: {
                        y: { type: "spring", stiffness: 250, damping: 18, mass: 0.8 },
                        opacity: { duration: 0.4 }
                    }
                }
            }}
            transition={{ type: "none" }}
            onDragStart={handleBringToFront}
            onDragEnd={(e, info) => {
                const newX = (note.x || 100) + info.offset.x;
                const newY = (note.y || 100) + info.offset.y;
                updateNote(note.id, { x: newX, y: newY });
            }}
            onPointerDown={handleBringToFront}
            layout={false} // CRITICAL GPU OFF-LOAD: Disable automatic layout reflow animations
            className="absolute pointer-events-auto will-change-transform"
            style={{
                left: 0,
                top: 0,
                zIndex: finalZIndex,
            }}
        >
            <StickyNoteItem
                note={note}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onPermanentDelete={permanentDeleteNote}
                onRestore={restoreNote}
                onAdd={addNote}
                dragControls={dragControls}
                isAdmin={isAdmin}
                onFocus={handleBringToFront}
            />
        </m.div>
    );
};
