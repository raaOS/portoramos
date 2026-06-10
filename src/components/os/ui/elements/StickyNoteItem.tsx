'use client';

import React, { useRef, useEffect } from 'react';
import { sanitize } from '@/lib/security/sanitization';
import { DragControls } from 'motion/react';
import { NoteHeader } from '../NoteHeader';
import { NoteFooter } from '../NoteFooter';

export interface NoteData {
  id: string;
  text: string;
  date: string;
  color: string; // Hex code
  isStarred: boolean;
  isDeleted: boolean;
  // Legacy pixel-based (keep for fallback)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Percentage-based for responsive positioning
  xPct?: number;
  yPct?: number;
  widthPct?: number;
  heightPct?: number;
  // Reference screen dimensions (when admin saved)
  refScreenWidth?: number;
  refScreenHeight?: number;
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
  /**
   * Soft-delete persisted (admin only flow). Dipakai oleh tombol trash di
   * footer. Tidak dipakai oleh tombol X di header — itu pakai `onHide`.
   */
  onDelete: (id: string) => void;
  /**
   * Ephemeral hide per session. Dipakai oleh tombol X di header sehingga
   * visitor non-admin bisa "menutup" note tanpa menghapus dari database.
   * Note akan muncul kembali saat user toggle dock icon Notes.
   */
  onHide: (id: string) => void;
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
  onHide,
  onPermanentDelete,
  onRestore,
  dragControls,
  isAdmin = false,
  onFocus,
  onResizeStart,
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
        style: { transform: 'scale(1)' },
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
    <div
      ref={containerRef}
      className="group relative flex flex-col rounded-lg"
      style={{
        backgroundColor: note.color,
        width: width,
        height: note.isCollapsed ? '60px' : height,
        overflow: 'hidden',
      }}
    >
      {note.isPinned && (
        <div className="pointer-events-none absolute left-1/2 top-1 z-50 -translate-x-1/2">
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #ffcfcf, #ef4444 30%, #991b1b)',
            }}
          >
            <div className="absolute left-[12%] top-[12%] h-[20%] w-[30%] rounded-[50%] bg-white opacity-90 blur-[0.5px]" />
          </div>
        </div>
      )}

      <NoteHeader
        color={note.color}
        colors={COLORS}
        onColorChange={(c) => onUpdate(note.id, { color: c })}
        onHide={() => onHide(note.id)}
        onToggleCollapse={() => onUpdate(note.id, { isCollapsed: !note.isCollapsed })}
        isPinned={!!note.isPinned}
        dragControls={dragControls}
      />

      {!note.isCollapsed && (
        <div className="group relative flex flex-grow flex-col overflow-hidden px-4 pb-0 pt-16">
          <div
            ref={textAreaRef}
            contentEditable={false}
            onInput={handleContentChange}
            onBlur={handleBlur}
            onPointerDown={(e) => {
              e.stopPropagation();
              onFocus?.();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onFocus?.();
            }}
            onDragStart={(e) => e.preventDefault()}
            onPaste={handlePaste}
            dangerouslySetInnerHTML={{
              __html: sanitize.richText(note.text) || '<span>Empty note...</span>',
            }}
            className="sticky-note-content h-full w-full cursor-default resize-none overflow-y-auto whitespace-pre-wrap border-none bg-transparent text-lg leading-snug text-gray-800 outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            data-lenis-prevent
            style={{
              minHeight: '100px',
              outline: 'none',
              fontFamily: DEFAULT_FONT,
              fontSize: `${note.fontSize || 18}px`,
              pointerEvents: 'auto',
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
            className="absolute right-0 top-0 z-[60] h-full w-2 cursor-ew-resize"
            onMouseDown={(e) => onResizeStart(e, 'e')}
            onTouchStart={(e) => onResizeStart(e, 'e')}
            onPointerDown={(e) => e.stopPropagation()}
          />
          {/* Bottom Handle (Invisible) */}
          <div
            className="absolute bottom-0 left-0 z-[60] h-2 w-full cursor-ns-resize"
            onMouseDown={(e) => onResizeStart(e, 's')}
            onTouchStart={(e) => onResizeStart(e, 's')}
            onPointerDown={(e) => e.stopPropagation()}
          />
          {/* Corner Handle (Invisible) */}
          <div
            className="absolute bottom-0 right-0 z-[70] h-4 w-4 cursor-nwse-resize"
            onMouseDown={(e) => onResizeStart(e, 'se')}
            onTouchStart={(e) => onResizeStart(e, 'se')}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </>
      )}
    </div>
  );
}
