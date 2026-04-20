import React from 'react';
import { Maximize2 } from 'lucide-react';

interface WindowResizeHandlesProps {
    onResizeStart: (e: React.MouseEvent | React.TouchEvent, direction: 'e' | 's' | 'se') => void;
}

export function WindowResizeHandles({ onResizeStart }: WindowResizeHandlesProps) {
    return (
        <>
            {/* Right Handle */}
            <div
                className="absolute top-0 right-0 w-3 h-full cursor-ew-resize z-[60] group flex items-center justify-center"
                onMouseDown={(e) => onResizeStart(e, 'e')}
                onTouchStart={(e) => onResizeStart(e, 'e')}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="w-0.5 h-8 bg-gray-300 group-hover:bg-black/40 dark:group-hover:bg-white/40 rounded-full transition-colors" />
            </div>
            {/* Bottom Handle */}
            <div
                className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize z-[60] group flex items-center justify-center"
                onMouseDown={(e) => onResizeStart(e, 's')}
                onTouchStart={(e) => onResizeStart(e, 's')}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="w-8 h-0.5 bg-gray-300 group-hover:bg-black/40 dark:group-hover:bg-white/40 rounded-full transition-colors" />
            </div>
            {/* Corner Handle with Icon */}
            <div
                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-[70] group"
                onMouseDown={(e) => onResizeStart(e, 'se')}
                onTouchStart={(e) => onResizeStart(e, 'se')}
                onPointerDown={(e) => e.stopPropagation()}
            >
                {/* Background hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 active:bg-black/20 dark:group-hover:bg-white/10 dark:active:bg-white/20 transition-colors rounded-tl" />
                {/* Resize Icon */}
                <div className="absolute bottom-1 right-1 pointer-events-none">
                    <Maximize2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-black/60 dark:group-hover:text-white/60 transition-colors rotate-90" />
                </div>
            </div>
        </>
    );
}
