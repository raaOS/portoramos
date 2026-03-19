"use client";

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

// Types of focusable elements in the OS
type ElementType = 'window' | 'stickyNote' | 'dynamicIsland';

interface ZIndexEntry {
  id: string;
  type: ElementType;
  zIndex: number;
}

interface UnifiedZIndexContextType {
  // Get current z-index for an element
  getZIndex: (id: string) => number;
  // Bring element to front (returns new z-index)
  bringToFront: (id: string, type: ElementType) => number;
  // Get the highest z-index currently assigned
  getTopZIndex: () => number;
  // Check if element is on top
  isOnTop: (id: string) => boolean;
  // Get the element that's currently on top
  getTopElement: () => { id: string; type: ElementType } | null;
  // Reset all z-indexes (e.g., on logout)
  resetZIndexes: () => void;
  // Register element (optional, for tracking)
  registerElement: (id: string, type: ElementType) => void;
  // Unregister element
  unregisterElement: (id: string) => void;
}

const UnifiedZIndexContext = createContext<UnifiedZIndexContextType | undefined>(undefined);

const BASE_Z_INDEX = 100;
const _MAX_Z_INDEX = 999999; // Reserved for future use
const NORMALIZE_THRESHOLD = 900000; // Normalize when approaching max

export const useUnifiedZIndex = () => {
  const context = useContext(UnifiedZIndexContext);
  if (!context) {
    throw new Error("useUnifiedZIndex must be used within UnifiedZIndexProvider");
  }
  return context;
};

interface UnifiedZIndexProviderProps {
  children: ReactNode;
}

export const UnifiedZIndexProvider: React.FC<UnifiedZIndexProviderProps> = ({ children }) => {
  // Use ref for immediate synchronous updates (no batching issues)
  const elementsRef = useRef<Map<string, ZIndexEntry>>(new Map());
  const topZIndexRef = useRef(BASE_Z_INDEX);
  const [, forceUpdate] = useState({});

  // Trigger re-render when z-index changes
  const notifyUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  // Normalize z-indexes to prevent overflow
  const normalizeZIndexes = useCallback(() => {
    console.log('[ZIndexManager] Normalizing z-indexes...');
    
    const entries = Array.from(elementsRef.current.values());
    if (entries.length === 0) {
      topZIndexRef.current = BASE_Z_INDEX;
      return;
    }

    // Sort by current z-index
    entries.sort((a, b) => a.zIndex - b.zIndex);

    // Reassign starting from BASE_Z_INDEX
    entries.forEach((entry, index) => {
      const newZIndex = BASE_Z_INDEX + index;
      elementsRef.current.set(entry.id, { ...entry, zIndex: newZIndex });
    });

    topZIndexRef.current = BASE_Z_INDEX + entries.length;
    notifyUpdate();
  }, [notifyUpdate]);

  const bringToFront = useCallback((id: string, type: ElementType): number => {
    // Check if we need to normalize
    if (topZIndexRef.current >= NORMALIZE_THRESHOLD) {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => normalizeZIndexes());
      } else {
        setTimeout(normalizeZIndexes, 100);
      }
    }

    // Get next z-index
    const nextZIndex = topZIndexRef.current + 1;
    topZIndexRef.current = nextZIndex;

    // Update element
    elementsRef.current.set(id, {
      id,
      type,
      zIndex: nextZIndex
    });

    // Notify for re-render
    notifyUpdate();

    console.log(`[ZIndexManager] ${type} "${id}" moved to front with z-index ${nextZIndex}`);
    return nextZIndex;
  }, [normalizeZIndexes, notifyUpdate]);

  const getZIndex = useCallback((id: string): number => {
    return elementsRef.current.get(id)?.zIndex ?? BASE_Z_INDEX;
  }, []);

  const getTopZIndex = useCallback((): number => {
    return topZIndexRef.current;
  }, []);

  const isOnTop = useCallback((id: string): boolean => {
    const entry = elementsRef.current.get(id);
    if (!entry) return false;
    return entry.zIndex === topZIndexRef.current;
  }, []);

  const getTopElement = useCallback((): { id: string; type: ElementType } | null => {
    let topZ = -1;
    let topId = '';
    let topType: ElementType = 'window';
    
    elementsRef.current.forEach((entry) => {
      if (entry.zIndex > topZ) {
        topZ = entry.zIndex;
        topId = entry.id;
        topType = entry.type;
      }
    });
    
    return topZ >= 0 ? { id: topId, type: topType } : null;
  }, []);

  const resetZIndexes = useCallback(() => {
    elementsRef.current.clear();
    topZIndexRef.current = BASE_Z_INDEX;
    notifyUpdate();
  }, [notifyUpdate]);

  const registerElement = useCallback((id: string, type: ElementType) => {
    if (!elementsRef.current.has(id)) {
      elementsRef.current.set(id, { id, type, zIndex: BASE_Z_INDEX });
    }
  }, []);

  const unregisterElement = useCallback((id: string) => {
    elementsRef.current.delete(id);
    notifyUpdate();
  }, [notifyUpdate]);

  const value = React.useMemo(() => ({
    getZIndex,
    bringToFront,
    getTopZIndex,
    isOnTop,
    getTopElement,
    resetZIndexes,
    registerElement,
    unregisterElement,
  }), [
    getZIndex, bringToFront, getTopZIndex, isOnTop, getTopElement,
    resetZIndexes, registerElement, unregisterElement
  ]);

  return (
    <UnifiedZIndexContext.Provider value={value}>
      {children}
    </UnifiedZIndexContext.Provider>
  );
};
