'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  ReactNode,
  useSyncExternalStore,
} from 'react';

// Types of focusable elements in the OS
export type ElementType = 'window' | 'stickyNote' | 'desktopIcon' | 'dynamicIsland';

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
  registerElement: (id: string, type: ElementType, initialZIndex?: number) => void;
  // Unregister element
  unregisterElement: (id: string) => void;
  // Internal subscription helpers
  _subscribe: (onStoreChange: () => void) => () => void;
  _subscribeToId: (id: string, onStoreChange: () => void) => () => void;
  _getZIndexFor: (id: string) => number;
  _getTopId: () => string | null;
  _getGlobalTick: () => number;
}

const UnifiedZIndexContext = createContext<UnifiedZIndexContextType | undefined>(undefined);

const BASE_Z_INDEX = 100;
const NORMALIZE_THRESHOLD = 900000; // Normalize when approaching max

function normalizeInitialZIndex(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : BASE_Z_INDEX;
}

/**
 * Consume z-index context with GLOBAL subscription.
 *
 * Components yang me-read `getZIndex(id)` untuk banyak id (mis. `UnifiedLayer`,
 * `UIOverlaysLayer`) perlu re-render tiap kali zIndex berubah di mana pun.
 * Hook ini subscribe ke perubahan global (tick counter bertambah tiap update).
 *
 * Untuk **leaf component** yang hanya care ke satu id, prefer `useZIndexFor(id)`
 * — hanya re-render saat id tersebut berubah (lebih granular, lebih murah).
 */
export const useUnifiedZIndex = () => {
  const context = useContext(UnifiedZIndexContext);
  if (!context) {
    throw new Error('useUnifiedZIndex must be used within UnifiedZIndexProvider');
  }
  // Subscribe to global tick so consumer re-renders on ANY z-index change.
  useSyncExternalStore(context._subscribe, context._getGlobalTick, context._getGlobalTick);
  return context;
};

/**
 * Consume z-index context WITHOUT subscribing — only for components yang
 * cuma perlu akses mutator (bringToFront / register / unregister) dan TIDAK
 * render berdasarkan zIndex. Hemat re-render.
 */
export const useUnifiedZIndexActions = () => {
  const context = useContext(UnifiedZIndexContext);
  if (!context) {
    throw new Error('useUnifiedZIndexActions must be used within UnifiedZIndexProvider');
  }
  return context;
};

/**
 * Subscribe to z-index changes for a SPECIFIC element.
 *
 * PERFORMANCE FIX: Sebelumnya `useUnifiedZIndex` subscribe ke angka global
 * (`topZIndex`) sehingga setiap bring-to-front memicu re-render di seluruh
 * consumer (tiap window + tiap sticky note). Sekarang consumer hanya
 * re-render jika zIndex untuk `id` mereka yang berubah.
 */
export const useZIndexFor = (id: string): number => {
  const context = useContext(UnifiedZIndexContext);
  if (!context) {
    throw new Error('useZIndexFor must be used within UnifiedZIndexProvider');
  }
  const subscribe = useCallback(
    (onChange: () => void) => context._subscribeToId(id, onChange),
    [context, id]
  );
  const getSnapshot = useCallback(() => context._getZIndexFor(id), [context, id]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

/**
 * Subscribe to changes of which element is on top. Useful for focus ring UI.
 */
export const useTopZIndexId = (): string | null => {
  const context = useContext(UnifiedZIndexContext);
  if (!context) {
    throw new Error('useTopZIndexId must be used within UnifiedZIndexProvider');
  }
  return useSyncExternalStore(context._subscribe, context._getTopId, context._getTopId);
};

interface UnifiedZIndexProviderProps {
  children: ReactNode;
}

export const UnifiedZIndexProvider: React.FC<UnifiedZIndexProviderProps> = ({ children }) => {
  // Use ref for immediate synchronous updates (no batching issues)
  const elementsRef = useRef<Map<string, ZIndexEntry>>(new Map());
  const topZIndexRef = useRef(BASE_Z_INDEX);
  const topIdRef = useRef<string | null>(null);
  // Global tick untuk useSyncExternalStore snapshot — increment tiap update.
  const globalTickRef = useRef(0);

  // Global listeners (subscribe to ANY change — e.g. for useTopZIndexId)
  const listeners = useRef(new Set<() => void>());
  // Per-id listeners — only notified when that specific id's zIndex changes
  const idListeners = useRef<Map<string, Set<() => void>>>(new Map());

  const subscribe = useCallback((onStoreChange: () => void) => {
    listeners.current.add(onStoreChange);
    return () => {
      listeners.current.delete(onStoreChange);
    };
  }, []);

  const subscribeToId = useCallback((id: string, onStoreChange: () => void) => {
    let set = idListeners.current.get(id);
    if (!set) {
      set = new Set();
      idListeners.current.set(id, set);
    }
    set.add(onStoreChange);
    return () => {
      const s = idListeners.current.get(id);
      if (!s) return;
      s.delete(onStoreChange);
      if (s.size === 0) idListeners.current.delete(id);
    };
  }, []);

  const notifyGlobal = useCallback(() => {
    globalTickRef.current += 1;
    listeners.current.forEach((listener) => listener());
  }, []);

  const notifyId = useCallback((id: string) => {
    const set = idListeners.current.get(id);
    if (set) set.forEach((listener) => listener());
  }, []);

  const updateTopId = useCallback(() => {
    // Find which id has the current top zIndex.
    let topZ = -1;
    let topId: string | null = null;
    elementsRef.current.forEach((entry, id) => {
      if (entry.zIndex > topZ) {
        topZ = entry.zIndex;
        topId = id;
      }
    });
    topIdRef.current = topId;
  }, []);

  // Normalize z-indexes to prevent overflow
  const normalizeZIndexes = useCallback(() => {
    const entries = Array.from(elementsRef.current.values());
    if (entries.length === 0) {
      topZIndexRef.current = BASE_Z_INDEX;
      topIdRef.current = null;
      notifyGlobal();
      return;
    }

    // Sort by current z-index
    entries.sort((a, b) => a.zIndex - b.zIndex);

    // Reassign starting from BASE_Z_INDEX and notify each affected id
    const changedIds: string[] = [];
    entries.forEach((entry, index) => {
      const newZIndex = BASE_Z_INDEX + index;
      if (entry.zIndex !== newZIndex) {
        elementsRef.current.set(entry.id, { ...entry, zIndex: newZIndex });
        changedIds.push(entry.id);
      }
    });

    topZIndexRef.current = BASE_Z_INDEX + entries.length;
    updateTopId();
    changedIds.forEach(notifyId);
    notifyGlobal();
  }, [notifyGlobal, notifyId, updateTopId]);

  const bringToFront = useCallback(
    (id: string, type: ElementType): number => {
      const currentEntry = elementsRef.current.get(id);
      // Idempotent: kalau element ini memang sudah on-top, return zIndex lama.
      // BUGFIX: Sebelumnya cek `currentEntry?.zIndex === topZIndexRef.current`
      // yang salah, karena element baru register dengan zIndex=BASE juga memenuhi
      // kondisi saat topZIndexRef masih BASE — bringToFront jadi no-op di kasus itu.
      if (
        currentEntry &&
        topIdRef.current === id &&
        currentEntry.zIndex === topZIndexRef.current &&
        topZIndexRef.current > BASE_Z_INDEX
      ) {
        return currentEntry.zIndex;
      }

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
      elementsRef.current.set(id, { id, type, zIndex: nextZIndex });
      topIdRef.current = id;

      // Notify: only the element whose zIndex changed + global listeners (for top-id).
      notifyId(id);
      notifyGlobal();
      return nextZIndex;
    },
    [normalizeZIndexes, notifyId, notifyGlobal]
  );

  const getZIndex = useCallback((id: string): number => {
    return elementsRef.current.get(id)?.zIndex ?? BASE_Z_INDEX;
  }, []);

  const getTopZIndex = useCallback((): number => topZIndexRef.current, []);

  const isOnTop = useCallback((id: string): boolean => {
    return topIdRef.current === id;
  }, []);

  const getTopElement = useCallback((): { id: string; type: ElementType } | null => {
    const topId = topIdRef.current;
    if (!topId) return null;
    const entry = elementsRef.current.get(topId);
    return entry ? { id: entry.id, type: entry.type } : null;
  }, []);

  const resetZIndexes = useCallback(() => {
    const idsToNotify = Array.from(elementsRef.current.keys());
    elementsRef.current.clear();
    topZIndexRef.current = BASE_Z_INDEX;
    topIdRef.current = null;
    idsToNotify.forEach(notifyId);
    notifyGlobal();
  }, [notifyGlobal, notifyId]);

  const registerElement = useCallback(
    (id: string, type: ElementType, initialZIndex?: number) => {
      if (!elementsRef.current.has(id)) {
        const zIndex = normalizeInitialZIndex(initialZIndex);
        elementsRef.current.set(id, { id, type, zIndex });
        if (zIndex >= topZIndexRef.current) {
          topZIndexRef.current = zIndex;
          topIdRef.current = id;
        } else {
          updateTopId();
        }
        notifyId(id);
        notifyGlobal();
      }
    },
    [notifyGlobal, notifyId, updateTopId]
  );

  const unregisterElement = useCallback(
    (id: string) => {
      if (elementsRef.current.has(id)) {
        elementsRef.current.delete(id);
        if (topIdRef.current === id) updateTopId();
        notifyId(id);
        notifyGlobal();
      }
    },
    [notifyGlobal, notifyId, updateTopId]
  );

  const value = React.useMemo(
    () => ({
      getZIndex,
      bringToFront,
      getTopZIndex,
      isOnTop,
      getTopElement,
      resetZIndexes,
      registerElement,
      unregisterElement,
      _subscribe: subscribe,
      _subscribeToId: subscribeToId,
      _getZIndexFor: getZIndex,
      _getTopId: () => topIdRef.current,
      _getGlobalTick: () => globalTickRef.current,
    }),
    [
      getZIndex,
      bringToFront,
      getTopZIndex,
      isOnTop,
      getTopElement,
      resetZIndexes,
      registerElement,
      unregisterElement,
      subscribe,
      subscribeToId,
    ]
  );

  return <UnifiedZIndexContext.Provider value={value}>{children}</UnifiedZIndexContext.Provider>;
};
