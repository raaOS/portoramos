"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useRef, useEffect } from "react";
import { WindowState } from "@/hooks/useWindowManager";

interface WindowContextType {
  windows: WindowState[];
  openWindow: (id: string, config?: Partial<WindowState>) => void;
  closeWindow: (id: string) => void;
  isWindowOpen: (id: string) => boolean;
  bouncingDocId: string | null;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export const useWindowContext = () => {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error("useWindowContext must be used within WindowProvider");
  }
  return context;
};

interface WindowProviderProps {
  children: ReactNode;
  initialWindows?: WindowState[];
}

export const WindowProvider: React.FC<WindowProviderProps> = ({
  children,
  initialWindows = []
}) => {
  const [windows, setWindows] = useState<WindowState[]>(initialWindows);
  const [bouncingDocId, setBouncingDocId] = useState<string | null>(null);

  const topZIndexRef = useRef(20);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isWindowOpen = useCallback((id: string) => {
    return windows.find(w => w.id === id)?.isOpen ?? false;
  }, [windows]);

  const openWindow = useCallback((id: string, customConfig?: Partial<WindowState>) => {
    topZIndexRef.current += 1;
    const newZIndex = topZIndexRef.current;

    setWindows(prevWindows => {
      const existingWindow = prevWindows.find(w => w.id === id);

      if (existingWindow) {
        return prevWindows.map(w => {
          if (w.id === id) {
            return {
              ...w,
              isOpen: true,
              isMinimized: false,
              zIndex: newZIndex,
              ...(customConfig || {})
            };
          }
          return w;
        });
      } else {
        // Create new window if doesn't exist
        const newWindow: WindowState = {
          id,
          title: customConfig?.title || 'Window',
          isOpen: true,
          isMinimized: false,
          zIndex: newZIndex,
          noPadding: customConfig?.noPadding || false,
          content: customConfig?.content || null,
          initialPosition: customConfig?.initialPosition || { x: 100, y: 100 },
          width: customConfig?.width || 800,
          height: customConfig?.height || 600,
          ...(customConfig || {})
        };
        return [...prevWindows, newWindow];
      }
    });

    setBouncingDocId(id);

    // Clear bounce after animation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => setBouncingDocId(null), 2000);

    return newZIndex;
  }, [setWindows]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, isOpen: false, isMinimized: false };
      }
      return w;
    }));
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<WindowContextType>(() => ({
    windows,
    openWindow,
    closeWindow,
    isWindowOpen,
    bouncingDocId,
  }), [windows, openWindow, closeWindow, isWindowOpen, bouncingDocId]);

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
};
