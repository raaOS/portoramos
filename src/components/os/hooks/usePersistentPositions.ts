"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AboutData } from '@/types/about';

// Types
interface WindowPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IconPosition {
  x: number;
  y: number;
}

interface PositionsState {
  windows: Record<string, WindowPosition>;
  icons: Record<string, IconPosition>;
  notes: Record<string, { x: number; y: number; width: number; height: number }>;
}

const STORAGE_KEY = 'ramos-os-positions-v1';

// Helper: Load dari localStorage
function loadFromStorage(): Partial<PositionsState> {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

// Helper: Save ke localStorage
function saveToStorage(state: Partial<PositionsState>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[Positions] Failed to save:', e);
  }
}

export function usePersistentPositions(aboutData?: AboutData | null) {
  const [isLoaded, setIsLoaded] = useState(false);
  const positionsRef = useRef<PositionsState>({
    windows: {},
    icons: {},
    notes: {}
  });

  // Load pertama kali: localStorage > Firebase > default
  useEffect(() => {
    if (isLoaded) return;

    const localData = loadFromStorage();
    const firebaseData = aboutData?.windowPreferences || {};

    // Merge: localStorage priority (user sudah atur)
    const merged: PositionsState = {
      windows: {},
      icons: localData.icons || {},
      notes: localData.notes || {}
    };

    // Windows: cek localStorage dulu, kalau gak ada pakai Firebase
    Object.keys(firebaseData).forEach(id => {
      const pref = firebaseData[id];
      const local = localData.windows?.[id];
      
      merged.windows[id] = local || {
        x: pref?.x ?? 100,
        y: pref?.y ?? 80,
        width: pref?.width ?? 900,
        height: pref?.height ?? 600
      };
    });

    // Icon positions dari aboutData
    if (aboutData?.desktopPreferences?.iconPositions) {
      merged.icons = { 
        ...aboutData.desktopPreferences.iconPositions,
        ...localData.icons // localStorage menang
      };
    }

    positionsRef.current = merged;
    
    // Use queueMicrotask to avoid synchronous setState warning
    queueMicrotask(() => {
      setIsLoaded(true);
      console.log('[Positions] Loaded:', merged);
    });
  }, [aboutData, isLoaded]);

  // Get position
  const getWindowPosition = useCallback((id: string, defaults: WindowPosition): WindowPosition => {
    return positionsRef.current.windows[id] || defaults;
  }, []);

  const getIconPosition = useCallback((id: string, defaults: IconPosition): IconPosition => {
    return positionsRef.current.icons[id] || defaults;
  }, []);

  const getNotePosition = useCallback((id: string, defaults: { x: number; y: number; width: number; height: number }) => {
    return positionsRef.current.notes[id] || defaults;
  }, []);

  // Update position (real-time, auto-save)
  const updateWindowPosition = useCallback((id: string, pos: Partial<WindowPosition>) => {
    positionsRef.current.windows[id] = {
      ...positionsRef.current.windows[id],
      ...pos
    };
    saveToStorage(positionsRef.current);
  }, []);

  const updateIconPosition = useCallback((id: string, pos: IconPosition) => {
    positionsRef.current.icons[id] = pos;
    saveToStorage(positionsRef.current);
  }, []);

  const updateNotePosition = useCallback((id: string, pos: { x: number; y: number; width: number; height: number }) => {
    positionsRef.current.notes[id] = pos;
    saveToStorage(positionsRef.current);
  }, []);

  // Flush all ke server (admin only)
  const flushPositions = useCallback(async (csrfToken?: string) => {
    if (!csrfToken) return;
    
    try {
      const payload = {
        windowPreferences: positionsRef.current.windows,
        desktopPreferences: {
          iconPositions: positionsRef.current.icons
        }
      };

      await fetch('/api/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      console.log('[Positions] Flushed to server');
    } catch (error) {
      console.error('[Positions] Failed to flush:', error);
    }
  }, []);

  return {
    isLoaded,
    getWindowPosition,
    getIconPosition,
    getNotePosition,
    updateWindowPosition,
    updateIconPosition,
    updateNotePosition,
    flushPositions
  };
}
