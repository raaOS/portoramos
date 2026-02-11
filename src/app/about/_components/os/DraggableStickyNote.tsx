import React from "react";
import { m, useDragControls } from "framer-motion";
import StickyNoteItem, { NoteData } from "./StickyNoteItem";

interface DraggableStickyNoteProps {
    note: NoteData;
    updateNote: (id: string, updates: Partial<NoteData>) => void;
    bringToFrontNote: (id: string) => void;
    deleteNote: (id: string) => void;
    permanentDeleteNote: (id: string) => void;
    restoreNote: (id: string) => void;
    isAdmin?: boolean;
}

export const DraggableStickyNote = ({
    note,
    updateNote,
    bringToFrontNote,
    deleteNote,
    permanentDeleteNote,
    restoreNote,
    isAdmin = false
}: DraggableStickyNoteProps) => {
    const dragControls = useDragControls();

    return (
        <m.div
            key={note.id}
            drag={isAdmin && !note.isPinned}
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            animate={{
                x: note.x || 100,
                y: note.y || 100,
                scale: 1,
                opacity: note.opacity || 1
            }}
            transition={{ type: "none" }}
            onDragStart={() => bringToFrontNote(note.id)}
            onDragEnd={(e, info) => {
                if (!isAdmin) return;
                const newX = (note.x || 100) + info.offset.x;
                const newY = (note.y || 100) + info.offset.y;
                updateNote(note.id, { x: newX, y: newY });
            }}
            onPointerDown={() => bringToFrontNote(note.id)}
            className="absolute pointer-events-auto"
            style={{
                left: 0,
                top: 0,
                zIndex: note.isPinned ? 5000 + (note.zIndex || 0) : (note.zIndex || 1),
            }}
        >
            <StickyNoteItem
                note={note}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onPermanentDelete={permanentDeleteNote}
                onRestore={restoreNote}
                dragControls={dragControls}
                isAdmin={isAdmin}
            />
        </m.div>
    );
};
