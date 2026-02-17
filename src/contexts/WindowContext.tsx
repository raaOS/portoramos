"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
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
  const [topZIndex, setTopZIndex] = useState(20);

  const isWindowOpen = useCallback((id: string) => {
    return windows.find(w => w.id === id)?.isOpen ?? false;
  }, [windows]);

  const openWindow = useCallback((id: string, customConfig?: Partial<WindowState>) => {
    setWindows(prev => {
      const existingWindow = prev.find(w => w.id === id);
      
      if (existingWindow) {
        return prev.map(w => {
          if (w.id === id) {
            return { 
              ...w, 
              isOpen: true, 
              isMinimized: false,
              zIndex: topZIndex + 1,
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
          zIndex: topZIndex + 1,
          noPadding: customConfig?.noPadding || false,
          content: customConfig?.content || null,
          initialPosition: customConfig?.initialPosition || { x: 100, y: 100 },
          width: customConfig?.width || 800,
          height: customConfig?.height || 600,
          ...(customConfig || {})
        };
        return [...prev, newWindow];
      }
    });
    setTopZIndex(prev => prev + 1);
    setBouncingDocId(id);
    
    // Clear bounce after animation
    setTimeout(() => setBouncingDocId(null), 2000);
  }, [topZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        return { ...w, isOpen: false, isMinimized: false };
      }
      return w;
    }));
  }, []);

  const value: WindowContextType = {
    windows,
    openWindow,
    closeWindow,
    isWindowOpen,
    bouncingDocId,
  };

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
};