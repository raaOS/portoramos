import React from 'react';
import type { DragControls } from 'motion/react';
import { X } from 'lucide-react';

interface NoteHeaderProps {
  color: string;
  colors: string[];
  onColorChange: (color: string) => void;
  /**
   * Tombol "X" di header memanggil ini. Tujuannya adalah ephemeral hide
   * (per-session, tidak persist) — bukan delete. Ini supaya visitor non-admin
   * bisa "menyingkirkan" sticky note dari layar dan memunculkannya kembali
   * via dock icon Notes.
   */
  onHide: () => void;
  onToggleCollapse: () => void;
  isPinned: boolean;
  dragControls: DragControls;
}

export const NoteHeader = ({
  onHide,
  onToggleCollapse,
  isPinned,
  dragControls,
}: NoteHeaderProps) => (
  <div
    className="absolute left-0 right-0 top-0 z-20 flex h-[50px] cursor-grab items-center justify-between border-b border-black/5 pl-3 pr-1 active:cursor-grabbing"
    onPointerDown={(e) => {
      if (!isPinned) dragControls.start(e);
    }}
    onDoubleClick={onToggleCollapse}
  >
    <div></div>

    {/* Actions */}
    <div className="flex items-center" onPointerDown={(e) => e.stopPropagation()}>
      <button
        onClick={onHide}
        className="flex h-8 w-8 items-center justify-center text-gray-400 transition-colors hover:text-black"
        title="Sembunyikan"
      >
        <X size={16} />
      </button>
    </div>
  </div>
);
