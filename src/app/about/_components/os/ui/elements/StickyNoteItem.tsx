"use client";

import React, { useState, useRef, useEffect } from 'react';
import { sanitize } from '@/lib/security/sanitization';

import { m, DragControls } from 'motion/react';

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
// Uses system fonts instead of loading Google Fonts (saves ~60KB)
const DEFAULT_FONT = 'var(--font-handwritten, "Comic Sans MS", "Chalkboard SE", cursive)';

import { NoteHeader } from '../NoteHeader';
import { NoteFooter } from '../NoteFooter';

export default function StickyNoteItem({ note, onUpdate, onDelete, onPermanentDelete, onRestore, dragControls, isAdmin = false, onFocus, onResizeStart }: StickyNoteItemProps) {
    const textAreaRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [localSize, setLocalSize] = useState({ width: note.width || 280, height: note.height || 280 });

    // Sync local size when prop changes (external update)
    useEffect(() => {
        setLocalSize({ width: note.width || 280, height: note.height || 280 });
    }, [note.width, note.height]);

    const width = localSize.width;
    const height = localSize.height;



    // We'll use a ref to track the inner content without triggering re-renders while typing
    const innerContentRef = useRef(note.text);

    // Initial load sync - very important for rendering HTML from server on first paint
    useEffect(() => {
        if (textAreaRef.current && note.text) {
            const sanitizedText = sanitize.richText(note.text);
            if (textAreaRef.current.innerHTML !== sanitizedText) {
                textAreaRef.current.innerHTML = sanitizedText;
                innerContentRef.current = sanitizedText;
            }
        }
    }, [note.text]);

    // Sync only when note.text changes externally
    useEffect(() => {
        if (textAreaRef.current) {
            const currentDOM = textAreaRef.current.innerHTML;
            const sanitizedText = sanitize.richText(note.text);
            if (currentDOM !== sanitizedText) {
                textAreaRef.current.innerHTML = sanitizedText || '<span>Empty note...</span>';
                innerContentRef.current = sanitizedText;
            }
        }
    }, [note.text, note.isCollapsed]);

    const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
        const newHtml = e.currentTarget.innerHTML;
        innerContentRef.current = newHtml;
        // DO NOT call onUpdate here, it causes parent re-renders and cursor jumps
    };

    const handleBlur = () => {
        // Only sync with parent when user stops interacting
        onUpdate(note.id, { text: innerContentRef.current });
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        // When editing in desktop, force plain text paste to keep UI clean
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };



    const handleDownload = async () => {
        if (!containerRef.current) return;
        try {
            // Lazy load html-to-image only when needed (~50KB saved from initial bundle)
            const htmlToImage = await import('html-to-image');
            const dataUrl = await htmlToImage.toPng(containerRef.current, {
                quality: 0.95,
                backgroundColor: 'transparent', // Preserve transparency/shape
                style: {
                    transform: 'scale(1)', // Normalize scale just in case
                }
            });
            const link = document.createElement('a');
            link.download = `sticky-note-${note.id.slice(0, 8)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to export note:', err);
            alert('Failed to save image.');
        }
    };

    return (
        <>
            <m.div
                ref={containerRef}
                // layout={!isResizing} // Removed to prevent jitter and unwanted flying animations
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute rounded-lg flex flex-col group`}
                style={{
                    backgroundColor: note.color,
                    width: width,
                    height: note.isCollapsed ? '60px' : height,
                    // opacity handling moved to parent wrapper in DesktopEnvironment
                    // zIndex handling moved to parent wrapper in DesktopEnvironment
                    overflow: 'hidden'
                }}
            >
                {/* Red Pin Visual (Visible when pinned) - 3D Ball Style */}
                {note.isPinned && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                        <div
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                // 3D Gradient: Highlight (Top Left) -> Mid Red -> Dark Red (Bottom Right)
                                background: 'radial-gradient(circle at 35% 30%, #ffcfcf, #ef4444 30%, #991b1b)'
                            }}
                        >
                            {/* Specular Highlight (The shiny white reflection) */}
                            <div className="absolute top-[12%] left-[12%] w-[30%] h-[20%] bg-white rounded-[50%] opacity-90 blur-[0.5px]" />
                        </div>
                    </div>
                )}


                {/* Header: Close (Double click to collapse) */}
                <NoteHeader
                    color={note.color}
                    colors={COLORS}
                    onColorChange={(c) => onUpdate(note.id, { color: c })}
                    onDelete={() => onDelete(note.id)}
                    onToggleCollapse={() => onUpdate(note.id, { isCollapsed: !note.isCollapsed })}
                    isPinned={!!note.isPinned}
                    dragControls={dragControls}
                />

                {/* Main Content Area (Hidden if collapsed) */}
                {!note.isCollapsed && (
                    <div className="flex-grow p-4 pt-16 overflow-hidden relative group flex flex-col">
                        {/* Formatting Toolbar has been moved to Admin Panel */}

                        {/* Text Display / Input */}
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
                            className={`sticky-note-content w-full h-full bg-transparent border-none outline-none resize-none text-gray-800 text-lg leading-snug whitespace-pre-wrap overflow-y-auto cursor-default`}
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


                {/* Footer / Toolbar (Hidden if collapsed) */}
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

                        {/* Resize Handles - Admin Only & Not Collapsed */}
                        {isAdmin && onResizeStart && !note.isCollapsed && (
                            <>
                                {/* Right Handle */}
                                <div
                                    className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-[60] group flex items-center justify-center"
                                    onMouseDown={(e) => onResizeStart(e, 'e')}
                                    onTouchStart={(e) => onResizeStart(e, 'e')}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <div className="w-0.5 h-6 bg-black/10 group-hover:bg-black/30 rounded-full transition-colors" />
                                </div>
                                {/* Bottom Handle */}
                                <div
                                    className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize z-[60] group flex items-center justify-center"
                                    onMouseDown={(e) => onResizeStart(e, 's')}
                                    onTouchStart={(e) => onResizeStart(e, 's')}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <div className="w-6 h-0.5 bg-black/10 group-hover:bg-black/30 rounded-full transition-colors" />
                                </div>
                                {/* Corner Handle */}
                                <div
                                    className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize z-[70] group flex flex-col items-center justify-center"
                                    onMouseDown={(e) => onResizeStart(e, 'se')}
                                    onTouchStart={(e) => onResizeStart(e, 'se')}
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                     <div className="w-full h-full flex flex-col items-end justify-end p-0.5">
                                        <div className="w-2 h-0.5 bg-black/20 rotate-[-45deg] translate-y-[-1px]" />
                                        <div className="w-3 h-0.5 bg-black/20 rotate-[-45deg]" />
                                     </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </m.div >
        </>
    );
}
