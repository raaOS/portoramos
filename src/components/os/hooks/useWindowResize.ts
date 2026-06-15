import { useState, useRef, useEffect } from 'react';

interface UseWindowResizeProps {
  initialWidth?: number;
  initialHeight?: number;
  onResize?: (width: number, height: number) => void;
  onResizeEnd?: (width: number, height: number) => void;
}

export function useWindowResize({
  initialWidth,
  initialHeight,
  onResize,
  onResizeEnd,
}: UseWindowResizeProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [dynamicSize, setDynamicSize] = useState({ width: initialWidth, height: initialHeight });
  const dynamicSizeRef = useRef(dynamicSize);
  const initialSizeRef = useRef({ width: initialWidth, height: initialHeight });

  useEffect(() => {
    dynamicSizeRef.current = dynamicSize;
  }, [dynamicSize]);

  useEffect(() => {
    initialSizeRef.current = { width: initialWidth, height: initialHeight };
  }, [initialWidth, initialHeight]);

  // Sync props to state (when not resizing)
  useEffect(() => {
    if (!isResizing) {
      const rafId = requestAnimationFrame(() =>
        setDynamicSize({ width: initialWidth, height: initialHeight })
      );
      return () => cancelAnimationFrame(rafId);
    }
  }, [initialWidth, initialHeight, isResizing]);

  const resizeStartRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
    dir: 'e' | 's' | 'se';
  } | null>(null);

  // Refs for callbacks to avoid stale closures
  const onResizeRef = useRef(onResize);
  const onResizeEndRef = useRef(onResizeEnd);
  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);
  useEffect(() => {
    onResizeEndRef.current = onResizeEnd;
  }, [onResizeEnd]);

  // Separate ref for final size (to avoid mutating start values)
  const finalSizeRef = useRef({ w: 0, h: 0 });
  const cleanupResizeListenersRef = useRef<(() => void) | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent | React.TouchEvent | React.PointerEvent,
    direction: 'e' | 's' | 'se'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    cleanupResizeListenersRef.current?.();
    setIsResizing(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const { width: latestWidth, height: latestHeight } = dynamicSizeRef.current;
    const { width: initialWidthValue, height: initialHeightValue } = initialSizeRef.current;
    const startWidth = latestWidth || initialWidthValue || 0;
    const startHeight = latestHeight || initialHeightValue || 0;
    resizeStartRef.current = {
      x: clientX,
      y: clientY,
      w: startWidth,
      h: startHeight,
      dir: direction,
    };
    finalSizeRef.current = { w: startWidth, h: startHeight };

    let rafId: number | null = null;
    let pendingSize = { width: startWidth, height: startHeight };
    const touchMoveOptions: AddEventListenerOptions = { passive: false };

    const getClientPoint = (moveEvent: MouseEvent | TouchEvent | PointerEvent) => {
      if ('touches' in moveEvent) {
        const touch = moveEvent.touches[0] || moveEvent.changedTouches[0];
        return { clientX: touch.clientX, clientY: touch.clientY };
      }

      return { clientX: moveEvent.clientX, clientY: moveEvent.clientY };
    };

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent | PointerEvent) => {
      moveEvent.preventDefault();
      if (!resizeStartRef.current) return;

      const { clientX, clientY } = getClientPoint(moveEvent);

      const {
        x: startX,
        y: startY,
        w: startWidth,
        h: startHeight,
        dir: direction,
      } = resizeStartRef.current;
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction === 'e' || direction === 'se') {
        newWidth = Math.max(300, startWidth + deltaX);
      }
      if (direction === 's' || direction === 'se') {
        newHeight = Math.max(200, startHeight + deltaY);
      }

      finalSizeRef.current = { w: newWidth, h: newHeight };

      pendingSize = { width: newWidth, height: newHeight };
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          setDynamicSize(pendingSize);
          rafId = null;
        });
      }
    };

    const handleMouseUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      const { width: currentWidth, height: currentHeight } = dynamicSizeRef.current;
      const { width: initialWidthValue, height: initialHeightValue } = initialSizeRef.current;
      const fallbackWidth = resizeStartRef.current?.w || currentWidth || initialWidthValue || 300;
      const fallbackHeight =
        resizeStartRef.current?.h || currentHeight || initialHeightValue || 200;
      const finalW = finalSizeRef.current.w || fallbackWidth;
      const finalH = finalSizeRef.current.h || fallbackHeight;

      setDynamicSize({ width: finalW, height: finalH });

      if (onResizeRef.current) onResizeRef.current(finalW, finalH);
      if (onResizeEndRef.current) onResizeEndRef.current(finalW, finalH);

      setIsResizing(false);
      resizeStartRef.current = null;
      cleanupResizeListenersRef.current?.();
      cleanupResizeListenersRef.current = null;
    };

    window.addEventListener('pointermove', handleMouseMove);
    window.addEventListener('pointerup', handleMouseUp);
    window.addEventListener('pointercancel', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, touchMoveOptions);
    window.addEventListener('touchend', handleMouseUp);

    cleanupResizeListenersRef.current = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('pointermove', handleMouseMove);
      window.removeEventListener('pointerup', handleMouseUp);
      window.removeEventListener('pointercancel', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove, touchMoveOptions);
      window.removeEventListener('touchend', handleMouseUp);
    };
  };

  useEffect(() => {
    return () => {
      cleanupResizeListenersRef.current?.();
    };
  }, []);

  return {
    dynamicSize,
    isResizing,
    handleResizeStart,
  };
}
