import React from 'react';

interface WindowResizeHandlesProps {
  onResizeStart: (
    e: React.MouseEvent | React.TouchEvent | React.PointerEvent,
    direction: 'e' | 's' | 'se'
  ) => void;
}

export function WindowResizeHandles({ onResizeStart }: WindowResizeHandlesProps) {
  return (
    <>
      {/* Right Handle (Invisible) */}
      <div
        data-testid="window-resize-e"
        className="absolute right-0 top-0 z-[60] h-full w-3 cursor-ew-resize touch-none select-none"
        onPointerDown={(e) => onResizeStart(e, 'e')}
      />
      {/* Bottom Handle (Invisible) */}
      <div
        data-testid="window-resize-s"
        className="absolute bottom-0 left-0 z-[60] h-3 w-full cursor-ns-resize touch-none select-none"
        onPointerDown={(e) => onResizeStart(e, 's')}
      />
      {/* Corner Handle (Invisible) */}
      <div
        data-testid="window-resize-se"
        className="absolute bottom-0 right-0 z-[70] h-6 w-6 cursor-nwse-resize touch-none select-none"
        onPointerDown={(e) => onResizeStart(e, 'se')}
      />
    </>
  );
}
