import React from 'react';
import type { DragControls } from 'motion/react';
import { X } from 'lucide-react';

interface NoteHeaderProps {
    color: string;
    colors: string[];
    onColorChange: (color: string) => void;
    onDelete: () => void;
    onToggleCollapse: () => void;
    isPinned: boolean;
    dragControls: DragControls;
}

export const NoteHeader = ({
    onDelete,
    onToggleCollapse,
    isPinned,
    dragControls
}: NoteHeaderProps) => (
    <div
        className="absolute top-0 left-0 right-0 h-[50px] pl-3 pr-1 z-20 flex items-center justify-between border-b border-black/5 cursor-grab active:cursor-grabbing"
        onPointerDown={(e) => {
            if (!isPinned) dragControls.start(e);
        }}
        onDoubleClick={onToggleCollapse}
    >
        <div></div>

        {/* Actions */}
        <div className="flex items-center" onPointerDown={(e) => e.stopPropagation()}>

            <button
                onClick={onDelete}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                title="Tutup"
            >
                <X size={16} />
            </button>
        </div>
    </div>
);
