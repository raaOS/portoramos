import React from 'react';
import { Maximize2 } from 'lucide-react';

interface WindowResizeHandlesProps {
    onResizeStart: (e: React.MouseEvent | React.TouchEvent, direction: 'e' | 's' | 'se') => void;
}

export function WindowResizeHandles({ onResizeStart }: WindowResizeHandlesProps) {
    return (
        <>
            {/* Right Handle (Invisible) */}
            <div
                className="absolute top-0 right-0 w-3 h-full cursor-ew-resize z-[60]"
                onMouseDown={(e) => onResizeStart(e, 'e')}
                onTouchStart={(e) => onResizeStart(e, 'e')}
                onPointerDown={(e) => e.stopPropagation()}
            />
            {/* Bottom Handle (Invisible) */}
            <div
                className="absolute bottom-0 left-0 w-full h-3 cursor-ns-resize z-[60]"
                onMouseDown={(e) => onResizeStart(e, 's')}
                onTouchStart={(e) => onResizeStart(e, 's')}
                onPointerDown={(e) => e.stopPropagation()}
            />
            {/* Corner Handle (Invisible) */}
            <div
                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-[70]"
                onMouseDown={(e) => onResizeStart(e, 'se')}
                onTouchStart={(e) => onResizeStart(e, 'se')}
                onPointerDown={(e) => e.stopPropagation()}
            />
        </>
    );
}
