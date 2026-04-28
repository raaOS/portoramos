"use client";

import React, { useRef, useEffect } from 'react';
import { sanitize } from '@/lib/security/sanitization';
import { m, DragControls } from 'motion/react';
import { NoteHeader } from '../NoteHeader';
import { NoteFooter } from '../NoteFooter';

export interface NoteData {
    id: string;
    text: string;
    date: string;
    color: string; // Hex code
    isStarred: boolean;
    isDeleted: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    isPinned?: boolean;
    isCollapsed?: boolean;
    opacity?: number;
    zIndex?: number;
    fontFamily?: string;
    fontSize?: number;
}

interface StickyNoteItemProps {
    note: NoteData;
    onUpdate: (id: string, updates: Partial<NoteData>) => void;
    onDelete: (id: string) => void;
    onPermanentDelete: (id: string) => void;
    onRestore: (id: string) => void;
    onAdd?: () => void;
    dragControls: DragControls;
    isAdmin?: boolean;
    onFocus?: () => void;
    onResizeStart?: (e: React.MouseEvent | React.TouchEvent, direction: 'e' | 's' | 'se') => void;
    isResizing?: boolean;
}

const COLORS = [
    '#fef08a', // Yellow
    '#bfdbfe', // Blue
    '#bbf7d0', // Green
    '#fbcfe8', // Pink
    '#f5f5f4', // White
    '#ddd6fe', // Purple
];

// Default font: System handwritten fonts (performance optimized)
const DEFAULT_FONT = 'var(--font-handwritten, "Comic Sans MS", "Chalkboard SE", cursive)';

export default function StickyNoteItem({ 
    note, 
    onUpdate, 
    onDelete, 
    onPermanentDelete, 
    onRestore, 
    dragControls, 
    isAdmin = false, 
    onFocus, 
    onResizeStart 
}: StickyNoteItemProps) {
    const textAreaRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const innerContentRef = useRef(note.text);

    const width = note.width || 280;
    const height = note.height || 280;

    // Initial load sync and external updates
    useEffect(() => {
        if (textAreaRef.current) {
            const sanitizedText = sanitize.richText(note.text);
            if (textAreaRef.current.innerHTML !== sanitizedText) {
                textAreaRef.current.innerHTML = sanitizedText;
                innerContentRef.current = sanitizedText;
            }
        }
    }, [note.text, note.isCollapsed]);

    const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
        const newHtml = e.currentTarget.innerHTML;
        innerContentRef.current = newHtml;
    };

    const handleBlur = () => {
        onUpdate(note.id, { text: innerContentRef.current });
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const handleDownload = async () => {
        if (!containerRef.current) return;
        try {
            const htmlToImage = await import('html-to-image');
            const dataUrl = await htmlToImage.toPng(containerRef.current, {
                quality: 0.95,
                backgroundColor: 'transparent',
                style: { transform: 'scale(1)' }
            });
            const link = document.createElement('a');
            link.download = `sticky-note-${note.id.slice(0, 8)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to export note:', err);
        }
    };

    return (
        <m.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute rounded-lg flex flex-col group"
            style={{
                backgroundColor: note.color,
                width: width,
                height: note.isCollapsed ? '60px' : height,
                overflow: 'hidden'
            }}
        >
            {note.isPinned && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div
                        style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle at 35% 30%, #ffcfcf, #ef4444 30%, #991b1b)'
                        }}
                    >
                        <div className="absolute top-[12%] left-[12%] w-[30%] h-[20%] bg-white rounded-[50%] opacity-90 blur-[0.5px]" />
                    </div>
                </div>
            )}

            <NoteHeader
                color={note.color}
                colors={COLORS}
                onColorChange={(c) => onUpdate(note.id, { color: c })}
                onDelete={() => onDelete(note.id)}
                onToggleCollapse={() => onUpdate(note.id, { isCollapsed: !note.isCollapsed })}
                isPinned={!!note.isPinned}
                dragControls={dragControls}
            />

            {!note.isCollapsed && (
                <div className="flex-grow px-4 pt-12 pb-0 overflow-hidden relative group flex flex-col">
                    <div
                        ref={textAreaRef}
                        contentEditable={false}
                        onInput={handleContentChange}
                        onBlur={handleBlur}
                        onPointerDown={(e) => { e.stopPropagation(); onFocus?.(); }}
                        onMouseDown={(e) => { e.stopPropagation(); onFocus?.(); }}
                        onDragStart={(e) => e.preventDefault()}
                        onPaste={handlePaste}
                        dangerouslySetInnerHTML={{ __html: sanitize.richText(note.text) || '<span>Empty note...</span>' }}
                        className="sticky-note-content w-full h-full bg-transparent border-none outline-none resize-none text-gray-800 text-lg leading-snug whitespace-pre-wrap overflow-y-auto cursor-default [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        data-lenis-prevent
                        style={{
                            minHeight: '100px',
                            outline: 'none',
                            fontFamily: DEFAULT_FONT,
                            fontSize: `${note.fontSize || 18}px`,
                            pointerEvents: 'auto'
                        }}
                    />
                </div>
            )}

            {!note.isCollapsed && (
                <div className="relative">
                    <NoteFooter
                        isAdmin={isAdmin}
                        isDeleted={note.isDeleted}
                        isPinned={!!note.isPinned}
                        isStarred={note.isStarred}
                        opacity={note.opacity || 1}
                        onDelete={() => onDelete(note.id)}
                        onRestore={() => onRestore(note.id)}
                        onPermanentDelete={() => onPermanentDelete(note.id)}
                        onDownload={handleDownload}
                    />

                </div>
            )}

            {onResizeStart && !note.isCollapsed && (
                <>
                    {/* Right Handle (Invisible) */}
                    <div
                        className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-[60]"
                        onMouseDown={(e) => onResizeStart(e, 'e')}
                        onTouchStart={(e) => onResizeStart(e, 'e')}
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                    {/* Bottom Handle (Invisible) */}
                    <div
                        className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize z-[60]"
                        onMouseDown={(e) => onResizeStart(e, 's')}
                        onTouchStart={(e) => onResizeStart(e, 's')}
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                    {/* Corner Handle (Invisible) */}
                    <div
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-[70]"
                        onMouseDown={(e) => onResizeStart(e, 'se')}
                        onTouchStart={(e) => onResizeStart(e, 'se')}
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                </>
            )}
        </m.div>
    );
}
