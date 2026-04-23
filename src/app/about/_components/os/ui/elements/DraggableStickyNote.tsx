import React from "react";
import { m, useDragControls } from "motion/react";
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

    // Resize Logic (Internal to avoid jitter)
    const [isResizing, setIsResizing] = React.useState(false);
    const [dynamicSize, setDynamicSize] = React.useState({ 
        width: note.width || 280, 
        height: note.height || 280 
    });
    
    // Resize Handlers Refs
    const resizeStartRef = React.useRef<{ x: number, y: number, w: number, h: number, dir: 'e' | 's' | 'se' } | null>(null);
    const finalSizeRef = React.useRef({ w: 0, h: 0 });

    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, direction: 'e' | 's' | 'se') => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        resizeStartRef.current = {
            x: clientX,
            y: clientY,
            w: dynamicSize.width,
            h: dynamicSize.height,
            dir: direction
        };
    };

    React.useEffect(() => {
        if (!isResizing) return;

        // PERFORMANCE FIX: Use requestAnimationFrame for throttled updates
        let rafId: number | null = null;
        let pendingSize = { width: 0, height: 0 };

        const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
            if (!resizeStartRef.current) return;

            const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

            const { x: startX, y: startY, w: startWidth, h: startHeight, dir: direction } = resizeStartRef.current;
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            if (direction === 'e' || direction === 'se') {
                newWidth = Math.max(200, startWidth + deltaX);
            }
            if (direction === 's' || direction === 'se') {
                newHeight = Math.max(150, startHeight + deltaY);
            }

            // Store final size in ref
            finalSizeRef.current = { w: newWidth, h: newHeight };

            // PERFORMANCE FIX: Throttle setState with requestAnimationFrame
            pendingSize = { width: newWidth, height: newHeight };
            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    setDynamicSize(pendingSize);
                    rafId = null;
                });
            }
        };

        const handleMouseUp = () => {
            // Cancel any pending animation frame
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            if (isResizing) {
                const finalW = finalSizeRef.current.w;
                const finalH = finalSizeRef.current.h;
                if (finalW > 0) {
                    // Ensure final size is applied before notifying parent
                    setDynamicSize({ width: finalW, height: finalH });
                    updateNote(note.id, { width: finalW, height: finalH });
                }
            }
            setIsResizing(false);
            resizeStartRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleMouseMove, { passive: false });
        window.addEventListener('touchend', handleMouseUp);

        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isResizing, note.id, updateNote]);

    // Update dynamic size when props change externally (Sync during render to avoid cascading updates)
    const [prevProps, setPrevProps] = React.useState({ w: note.width, h: note.height });
    if (note.width !== prevProps.w || note.height !== prevProps.h) {
        setPrevProps({ w: note.width, h: note.height });
        if (!isResizing) {
            setDynamicSize({ 
                width: note.width || 280, 
                height: note.height || 280 
            });
        }
    }

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
            drag={!note.isPinned && !isResizing}
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
                    width: dynamicSize.width,
                    transition: {
                        y: { type: "spring", stiffness: 250, damping: 18, mass: 0.8 },
                        opacity: { duration: 0.4 }
                    } as any
                }
            }}
            transition={{ type: "none" } as any}
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
                note={{ ...note, width: dynamicSize.width, height: dynamicSize.height }}
                onUpdate={updateNote}
                onDelete={deleteNote}
                onPermanentDelete={permanentDeleteNote}
                onRestore={restoreNote}
                onAdd={addNote}
                dragControls={dragControls}
                isAdmin={isAdmin}
                onFocus={handleBringToFront}
                onResizeStart={handleResizeStart}
                isResizing={isResizing}
            />
        </m.div>
    );
};
