"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Star, Trash2, Edit, Palette, RotateCcw, Pin, Eye, EyeOff, Bold, Italic, List, ListOrdered, CheckSquare, Check, Download, X, Plus, Minus } from 'lucide-react';
import { m, AnimatePresence, DragControls } from 'framer-motion';
import dynamic from 'next/dynamic';

// Lazy load PasswordModal - only needed when editing locked notes
const PasswordModal = dynamic(() => import('./PasswordModal'), {
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

// Default font is Ala Nanti
const DEFAULT_FONT = 'var(--font-caveat), sans-serif';

export default function StickyNoteItem({ note, onUpdate, onDelete, onPermanentDelete, onRestore, dragControls, isAdmin = false }: StickyNoteItemProps) {
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
                <div
                    className="absolute top-0 left-0 right-0 h-[50px] pl-3 pr-1 z-20 flex items-center justify-between border-b border-black/5 cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => {
                        if (!note.isPinned) dragControls.start(e);
                    }}
                    onDoubleClick={() => {
                        onUpdate(note.id, {
                            isCollapsed: !note.isCollapsed
                        });
                    }}
                >
                    {/* Color Picker */}
                    <div className="flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => onUpdate(note.id, { color: c })}
                                className="rounded-full border border-black/10 hover:scale-125 transition-transform flex items-center justify-center shrink-0"
                                style={{
                                    backgroundColor: c,
                                    width: '12px',
                                    height: '12px',
                                    minWidth: '12px',
                                    minHeight: '12px'
                                }}
                                title="Set Warna"
                            >
                                {note.color === c && <Check size={8} className="text-black/60" strokeWidth={3} />}
                            </button>
                        ))}
                    </div>

                    {/* Close Button */}
                    <div onPointerDown={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => onDelete(note.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                            title="Tutup"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Main Content Area (Hidden if collapsed) */}
                {!note.isCollapsed && (
                    <div className="flex-grow p-4 pt-16 overflow-hidden relative group flex flex-col">
                        {/* Formatting Toolbar (Visible only when editing) */}
                        {isEditing && isAdmin && (
                            <div
                                className="flex items-center gap-1 mb-2 p-1 bg-black/5 rounded-md self-start flex-wrap"
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <button onClick={() => execFormat('bold')} className="p-1 hover:text-black text-gray-600 transition-colors" title="Bold">
                                    <Bold size={14} />
                                </button>
                                <button onClick={() => execFormat('italic')} className="p-1 hover:text-black text-gray-600 transition-colors" title="Italic">
                                    <Italic size={14} />
                                </button>
                                <button onClick={() => execFormat('insertUnorderedList')} className="p-1 hover:text-black text-gray-600 transition-colors" title="Bulleted List">
                                    <List size={14} />
                                </button>
                                <button onClick={() => execFormat('insertOrderedList')} className="p-1 hover:text-black text-gray-600 transition-colors" title="Numbered List">
                                    <ListOrdered size={14} />
                                </button>
                                <button onClick={insertChecklist} className="p-1 hover:text-black text-gray-600 transition-colors" title="Checklist">
                                    <CheckSquare size={14} />
                                </button>
                                <div className="w-[1px] h-4 bg-black/10 mx-1" />
                                <button onClick={() => execFormat('formatBlock', 'P')} className="p-1 hover:text-black text-gray-600 transition-colors text-xs font-bold w-6 text-center" title="Paragraph">
                                    P
                                </button>
                                <button onClick={() => execFormat('formatBlock', 'H1')} className="p-1 hover:text-black text-gray-600 transition-colors text-xs font-bold w-6 text-center" title="Heading 1">
                                    H1
                                </button>
                                <div className="w-[1px] h-4 bg-black/10 mx-1" />
                                <div className="flex items-center bg-black/5 rounded px-1 gap-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const currentSize = note.fontSize || 18;
                                            onUpdate(note.id, { fontSize: Math.max(10, currentSize - 2) });
                                        }}
                                        className="p-1 hover:bg-black/10 rounded transition-colors text-gray-600"
                                        title="Decrease font size"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="text-[10px] font-bold text-gray-500 w-4 text-center select-none">
                                        {note.fontSize || 18}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const currentSize = note.fontSize || 18;
                                            onUpdate(note.id, { fontSize: Math.min(72, currentSize + 2) });
                                        }}
                                        className="p-1 hover:bg-black/10 rounded transition-colors text-gray-600"
                                        title="Increase font size"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                            </div>
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
                    <div className="h-14 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 ml-auto">
                            {/* Action Icons */}
                            {!note.isDeleted ? (
                                <>
                                    {/* Edit Toggle - Admin Only */}
                                    {isAdmin && (
                                        <button
                                            onClick={handleEditClick}
                                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${isEditing ? 'text-blue-600 font-bold' : 'text-gray-700 hover:text-blue-600'}`}
                                            title="Edit Note"
                                            style={{ minWidth: '36px', minHeight: '36px' }}
                                        >
                                            <Edit size={18} />
                                        </button>
                                    )}

                                    {/* Pin Toggle - Admin Only */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => onUpdate(note.id, { isPinned: !note.isPinned })}
                                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${note.isPinned ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'}`}
                                            title={note.isPinned ? "Unlock Position" : "Lock Position (Pin)"}
                                            style={{ minWidth: '36px', minHeight: '36px' }}
                                        >
                                            <Pin size={18} className={note.isPinned ? "fill-current" : ""} />
                                        </button>
                                    )}

                                    {/* Opacity Cycle - Public OK? User requested logic same as windows, windows only admin has pin. Let's keep appearance settings public for now or hide? The request said 'logic same as windows'. Windows pin button is only for admin. Appearance settings usually personal/admin. Let's hide them for public to keep 'read only' promise strict, except maybe download. */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => {
                                                const current = note.opacity || 1;
                                                const next = current === 1 ? 0.75 : current === 0.75 ? 0.5 : 1;
                                                onUpdate(note.id, { opacity: next });
                                            }}
                                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors text-gray-700 hover:text-purple-600`}
                                            title="Toggle Transparency"
                                            style={{ minWidth: '36px', minHeight: '36px' }}
                                        >
                                            {note.opacity && note.opacity < 1 ? (
                                                <EyeOff size={18} className="text-purple-600" />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    )}

                                    {/* Star Toggle - Admin Only (Updates state) */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => onUpdate(note.id, { isStarred: !note.isStarred })}
                                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${note.isStarred ? 'text-black' : 'text-gray-700 hover:text-yellow-600'}`}
                                            title="Star Note"
                                            style={{ minWidth: '36px', minHeight: '36px' }}
                                        >
                                            <Star size={18} fill={note.isStarred ? "currentColor" : "none"} />
                                        </button>
                                    )}

                                    {/* Delete (Soft) - Admin Only */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => onDelete(note.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 transition-colors hover:text-red-600"
                                            title="Delete Note"
                                            style={{ minWidth: '36px', minHeight: '36px' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}

                                    {/* Download / Export - Public OK */}
                                    <button
                                        onClick={handleDownload}
                                        className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 transition-colors hover:text-blue-600"
                                        title="Download as PNG"
                                        style={{ minWidth: '36px', minHeight: '36px' }}
                                    >
                                        <Download size={18} />
                                    </button>
                                </>
                            ) : (
                                /* Deleted State Options - Admin Only */
                                isAdmin && (
                                    <>
                                        <button
                                            onClick={() => onRestore(note.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:text-green-600 transition-colors"
                                            title="Restore Note"
                                        >
                                            <RotateCcw size={18} />
                                        </button>
                                        <button
                                            onClick={() => onPermanentDelete(note.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:text-red-600 transition-colors"
                                            title="Delete Permanently"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )
                            )}
                        </div>
                    </div>
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
            </m.div>

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
