import { useEffect, useCallback } from 'react';

export function useQuickLook(isActive: boolean, onTrigger: () => void) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only trigger if active and Space is pressed (without modifier keys like Command/Ctrl)
      if (isActive && e.code === 'Space' && !e.metaKey && !e.ctrlKey) {
        // Prevent scrolling
        e.preventDefault();
        e.stopPropagation();
        onTrigger();
      }
    },
    [isActive, onTrigger]
  );

  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown, { capture: true });
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [isActive, handleKeyDown]);
}
