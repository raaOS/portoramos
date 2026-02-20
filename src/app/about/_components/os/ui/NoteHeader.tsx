import React from 'react';
import { X, Check } from 'lucide-react';

interface NoteHeaderProps {
    color: string;
    colors: string[];
    onColorChange: (color: string) => void;
    onDelete: () => void;
    onToggleCollapse: () => void;
    isPinned: boolean;
    dragControls: any;
}

export const NoteHeader = ({
    color,
    colors,
    onColorChange,
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
        {/* Color Picker */}
        <div className="flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
            {colors.map(c => (
                <button
                    key={c}
                    onClick={() => onColorChange(c)}
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
                    {color === c && <Check size={8} className="text-black/60" strokeWidth={3} />}
                </button>
            ))}
        </div>

        {/* Close Button */}
        <div onPointerDown={(e) => e.stopPropagation()}>
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
