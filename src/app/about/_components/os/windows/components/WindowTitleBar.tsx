import React from 'react';
import { X, Minus, Plus, Pin, Lock } from 'lucide-react';
import { soundManager } from '../../utils/SoundManager';

interface WindowTitleBarProps {
    title: string;
    isMaximized: boolean;
    isPinned: boolean;
    isAdmin: boolean;
    onClose: () => void;
    onMinimize?: () => void;
    onMaximize?: () => void;
    onTogglePin?: () => void;
    onDragStart: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export function WindowTitleBar({
    title,
    isMaximized,
    isPinned,
    isAdmin,
    onClose,
    onMinimize,
    onMaximize,
    onTogglePin,
    onDragStart,
}: WindowTitleBarProps) {
    return (
        <div
            onPointerDown={(e) => {
                if (!isMaximized && (!isPinned || isAdmin)) {
                    onDragStart(e);
                }
            }}
            onDoubleClick={onMaximize}
            className="h-8 sm:h-7 bg-[#EFEFEF] border-b border-[#D1D1D1] flex items-center justify-between px-3 shrink-0 cursor-default select-none relative z-50"
        >
            {/* Traffic Lights */}
            <div className="flex gap-[8px] mr-3 items-center group">
                {/* Close Button (Red) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        soundManager.play('window-close');
                        onClose();
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center relative transition-all outline-none focus:outline-none focus:ring-0 active:outline-none"
                    aria-label="Close window"
                >
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] flex items-center justify-center relative transition-all hover:brightness-95 active:brightness-90">
                        <X size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={4} />
                    </div>
                </button>

                {/* Minimize Button (Yellow) */}
                <button
                    onClick={(e) => { e.stopPropagation(); if (onMinimize) onMinimize(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center relative transition-all outline-none focus:outline-none focus:ring-0 active:outline-none"
                    aria-label="Minimize window"
                >
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#DDA335] flex items-center justify-center relative transition-all hover:brightness-95 active:brightness-90">
                        <Minus size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={4} />
                    </div>
                </button>

                {/* Maximize Button (Green) */}
                <button
                    onClick={(e) => { e.stopPropagation(); if (onMaximize) onMaximize(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="w-6 h-6 min-w-[24px] min-h-[24px] p-0 rounded-full flex items-center justify-center relative transition-all outline-none focus:outline-none focus:ring-0 active:outline-none"
                    aria-label="Maximize window"
                >
                    <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#22AA32] flex items-center justify-center relative transition-all hover:brightness-95 active:brightness-90">
                        <Plus size={8} className="text-black/60 opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={4} />
                    </div>
                </button>
            </div>

            {/* Title Indicator */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 opacity-80 pointer-events-none w-[60%]">
                <span className="text-xs font-semibold text-gray-700 tracking-wide truncate block text-center w-full">{title}</span>
            </div>

            {/* Top Right Pin/Lock Button - Admin Only */}
            {isAdmin && onTogglePin && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`p-1 rounded transition-colors ${isPinned ? 'text-orange-600' : 'text-gray-400'}`}
                        title={isPinned ? "Unlock Position" : "Pin/Lock Position"}
                    >
                        {isPinned ? <Lock size={12} /> : <Pin size={12} />}
                    </button>
                </div>
            )}
        </div>
    );
}
