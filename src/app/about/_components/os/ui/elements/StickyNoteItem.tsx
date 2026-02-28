"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Star, Trash2, Edit, Palette, RotateCcw, Pin, Eye, EyeOff, Bold, Italic, List, ListOrdered, CheckSquare, Check, Download, X, Plus, Minus } from 'lucide-react';
import { m, AnimatePresence, DragControls } from 'framer-motion';
import dynamic from 'next/dynamic';

// Lazy load PasswordModal - only needed when editing locked notes
const PasswordModal = dynamic(() => import('../../windows/PasswordModal'), {
    loading: () => null,
    ssr: false
});

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
import { NoteToolbar } from '../NoteToolbar';
import { NoteFooter } from '../NoteFooter';

export default function StickyNoteItem({ note, onUpdate, onDelete, onPermanentDelete, onRestore, onAdd, dragControls, isAdmin = false }: StickyNoteItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const textAreaRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [localSize, setLocalSize] = useState({ width: note.width || 280, height: note.height || 280 });

    // Sync local size when prop changes (external update)
    useEffect(() => {
        if (!isResizing) {
            setLocalSize({ width: note.width || 280, height: note.height || 280 });
        }
    }, [note.width, note.height, isResizing]);

    const width = localSize.width;
    const height = localSize.height;

    // Handle Resize
    useEffect(() => {
        if (!isResizing) return;
        // Effect hook for resizing if needed in future
    }, [isResizing]);

    // We'll use a direct pointer down handler on the resize handle
    const handleResizeStart = (e: React.PointerEvent) => {
        if (!isAdmin) return; // Only admin can resize

        e.preventDefault();
        e.stopPropagation(); // Prevent drag of the note itself
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = localSize.width;
        const startHeight = localSize.height;

        let lastWidth = startWidth;
        let lastHeight = startHeight;

        const handlePointerMove = (moveEvent: PointerEvent) => {
            lastWidth = Math.max(200, startWidth + (moveEvent.clientX - startX));
            lastHeight = Math.max(200, startHeight + (moveEvent.clientY - startY));
            setLocalSize({ width: lastWidth, height: lastHeight });
        };

        const handlePointerUp = () => {
            setIsResizing(false);
            onUpdate(note.id, { width: lastWidth, height: lastHeight });
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
        };

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
    };

    const handleEditClick = () => {
        if (!isAdmin) return;

        if (isEditing) {
            setIsEditing(false);
            return;
        }

        if (isUnlocked) {
            setIsEditing(true);
            // Clear placeholder if it's there
            if (textAreaRef.current && note.text === '') {
                textAreaRef.current.innerHTML = '';
            }
        } else {
            // Simplified for admin: always allow edit without password modal for now, or keep logic if desired.
            // Keeping logic for now.
            setIsEditing(true);
        }
    };

    // We'll use a ref to track the inner content without triggering re-renders while typing
    const innerContentRef = useRef(note.text);

    // Sync only when not editing or when note.text changes externally
    useEffect(() => {
        if (textAreaRef.current) {
            const currentDOM = textAreaRef.current.innerHTML;
            // Case 1: External update (when not editing)
            if (!isEditing && currentDOM !== note.text) {
                textAreaRef.current.innerHTML = note.text || '<span class="text-gray-400 italic">Empty note...</span>';
                innerContentRef.current = note.text;
            }
            // Case 2: Newly mounted (e.g. after uncollapse) while editing
            else if (isEditing && (currentDOM === '' || currentDOM === '<br>')) {
                textAreaRef.current.innerHTML = innerContentRef.current || '';
            }
        }
    }, [note.text, isEditing, note.isCollapsed]); // Added isCollapsed to trigger on mount/uncollapse

    const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
        const newHtml = e.currentTarget.innerHTML;
        innerContentRef.current = newHtml;
        // DO NOT call onUpdate here, it causes parent re-renders and cursor jumps
    };

    const handleBlur = () => {
        // Only sync with parent when user stops interacting
        onUpdate(note.id, { text: innerContentRef.current });
    };

    const execFormat = (command: string, value?: string) => {
        if (textAreaRef.current) {
            textAreaRef.current.focus();
            document.execCommand(command, false, value);
            handleContentChange({ currentTarget: textAreaRef.current } as any);
            // After formatting, sync immediately so toolbar changes are saved
            onUpdate(note.id, { text: textAreaRef.current.innerHTML });
        }
    };

    const insertChecklist = () => {
        // Wrap in a div to ensure block level (vertical)
        const html = '<div style="display: flex; align-items: flex-start; gap: 8px; margin: 4px 0;"><input type="checkbox" style="margin-top: 6px; accent-color: black; width: 16px; height: 16px;" /> <span>&nbsp;</span></div>';
        execFormat('insertHTML', html);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        // Handle images
        if (e.clipboardData && e.clipboardData.files.length > 0) {
            const file = e.clipboardData.files[0];
            if (file.type.startsWith('image/')) {
                e.preventDefault();
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        const imgHtml = `<img src="${event.target.result}" style="max-width: 100%; border-radius: 4px; margin: 8px 0; display: block;" />`;
                        execFormat('insertHTML', imgHtml);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const formatDate = (dateStr: string) => {
        // Simple formatter, can be improved
        return new Date(dateStr).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
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
                className={`absolute rounded-lg flex flex-col shadow-md hover:shadow-xl group ${!isResizing ? 'transition-shadow duration-300' : ''}`}
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
                                background: 'radial-gradient(circle at 35% 30%, #ffcfcf, #ef4444 30%, #991b1b)',
                                // Shadows: Drop shadow + slight inset for rim separation
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)'
                            }}
                        >
                            {/* Specular Highlight (The shiny white reflection) */}
                            <div className="absolute top-[12%] left-[12%] w-[30%] h-[20%] bg-white rounded-[50%] opacity-90 blur-[0.5px]" />
                        </div>
                    </div>
                )}


                {/* Header: Color Picker & Close (Double click to collapse) */}
                <NoteHeader
                    color={note.color}
                    colors={COLORS}
                    onColorChange={(c) => onUpdate(note.id, { color: c })}
                    onDelete={() => onDelete(note.id)}
                    onToggleCollapse={() => onUpdate(note.id, { isCollapsed: !note.isCollapsed })}
                    onAdd={onAdd}
                    isPinned={!!note.isPinned}
                    dragControls={dragControls}
                />

                {/* Main Content Area (Hidden if collapsed) */}
                {!note.isCollapsed && (
                    <div className="flex-grow p-4 pt-16 overflow-hidden relative group flex flex-col">
                        {/* Formatting Toolbar (Visible only when editing) */}
                        {isEditing && isAdmin && (
                            <NoteToolbar
                                onFormat={execFormat}
                                onInsertChecklist={insertChecklist}
                                fontSize={note.fontSize || 18}
                                onFontSizeChange={(newSize) => onUpdate(note.id, { fontSize: newSize })}
                            />
                        )}

                        {/* Text Display / Input */}
                        <div
                            ref={textAreaRef}
                            contentEditable={isEditing && isAdmin}
                            onInput={handleContentChange}
                            onBlur={handleBlur}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onDragStart={(e) => e.preventDefault()}
                            onPaste={handlePaste}
                            className={`w-full h-full bg-transparent border-none outline-none resize-none text-gray-800 text-lg leading-snug whitespace-pre-wrap overflow-y-auto ${isEditing && isAdmin ? 'cursor-text' : 'cursor-default'}`}
                            data-lenis-prevent
                            style={{
                                minHeight: '100px',
                                outline: 'none',
                                fontFamily: DEFAULT_FONT,
                                fontSize: `${note.fontSize || 18}px`,
                                pointerEvents: 'auto'
                            }}
                        />

                        {/* Date Display (Inside content, bottom right) */}
                        <div className="absolute bottom-2 right-4 pointer-events-none select-none">
                            <span className="text-[10px] font-bold text-gray-500/30 uppercase tracking-widest italic">
                                {formatDate(note.date)}
                            </span>
                        </div>
                    </div>
                )}


                {/* Footer / Toolbar (Hidden if collapsed) */}
                {!note.isCollapsed && (
                    <NoteFooter
                        isAdmin={isAdmin}
                        isDeleted={note.isDeleted}
                        isEditing={isEditing}
                        isPinned={!!note.isPinned}
                        isStarred={note.isStarred}
                        opacity={note.opacity || 1}
                        onEditToggle={handleEditClick}
                        onPinToggle={() => onUpdate(note.id, { isPinned: !note.isPinned })}
                        onOpacityToggle={() => {
                            const current = note.opacity || 1;
                            const next = current === 1 ? 0.75 : current === 0.75 ? 0.5 : 1;
                            onUpdate(note.id, { opacity: next });
                        }}
                        onStarToggle={() => onUpdate(note.id, { isStarred: !note.isStarred })}
                        onDelete={() => onDelete(note.id)}
                        onRestore={() => onRestore(note.id)}
                        onPermanentDelete={() => onPermanentDelete(note.id)}
                        onDownload={handleDownload}
                    />
                )}

                {/* Resize Handle - Admin Only */}
                {!note.isCollapsed && isAdmin && (
                    <div
                        className="absolute bottom-0 right-0 w-8 h-8 cursor-se-resize z-30 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                        onPointerDown={handleResizeStart}
                        title="Resize Note"
                    >
                        <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                            <path d="M10 0L0 10V10H10V0Z" fill="black" />
                        </svg>
                    </div>
                )}
            </m.div >

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSuccess={() => {
                    setIsUnlocked(true);
                    setIsEditing(true);
                    setShowPasswordModal(false);
                }}
            />
        </>
    );
}
