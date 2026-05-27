'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface OSSystemContextType {
  // Spotlight visibility
  showSpotlight: boolean;
  setShowSpotlight: (show: boolean) => void;
  toggleSpotlight: () => void;

  // Sticky notes visibility
  notesVisible: boolean;
  setNotesVisible: (visible: boolean) => void;
  toggleNotes: () => void;

  // Per-note ephemeral hide (X button on note header).
  // Beda dari `isDeleted` yang persist ke server — hidden cuma in-memory
  // dan auto-reveal saat user klik dock icon Notes lagi.
  hiddenNoteIds: ReadonlySet<string>;
  hideNote: (id: string) => void;
  unhideAllNotes: () => void;

  // Control Center visibility
  showControlCenter: boolean;
  setShowControlCenter: (show: boolean) => void;

  // Calendar visibility
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;

  brightness: number;
  setBrightness: (val: number) => void;
  volume: number;
  setVolume: (val: number) => void;
  // Boot / Reveal status
  isRevealed: boolean;
  setIsRevealed: (revealed: boolean) => void;
  startScreenReady: boolean;
  setStartScreenReady: (ready: boolean) => void;
}

const OSSystemContext = createContext<OSSystemContextType | undefined>(undefined);

export const useOSSystem = () => {
  const context = useContext(OSSystemContext);
  if (!context) {
    throw new Error('useOSSystem must be used within OSSystemProvider');
  }
  return context;
};

interface OSSystemProviderProps {
  children: ReactNode;
}

export const OSSystemProvider: React.FC<OSSystemProviderProps> = ({ children }) => {
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [notesVisible, setNotesVisible] = useState(true);
  const [hiddenNoteIds, setHiddenNoteIds] = useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setTimeout(() => {
        setNotesVisible(false);
      }, 0);
    }
  }, []);
  const [isRevealed, setIsRevealed] = useState(false);
  const [startScreenReady, setStartScreenReady] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(50);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const toggleSpotlight = useCallback(() => setShowSpotlight((prev) => !prev), []);
  const toggleNotes = useCallback(() => setNotesVisible((prev) => !prev), []);

  const hideNote = useCallback((id: string) => {
    setHiddenNoteIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const unhideAllNotes = useCallback(() => {
    setHiddenNoteIds((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  const value = React.useMemo(
    () => ({
      showSpotlight,
      setShowSpotlight,
      toggleSpotlight,
      notesVisible,
      setNotesVisible,
      toggleNotes,
      hiddenNoteIds,
      hideNote,
      unhideAllNotes,
      isRevealed,
      setIsRevealed,
      startScreenReady,
      setStartScreenReady,
      brightness,
      setBrightness,
      volume,
      setVolume,
      showControlCenter,
      setShowControlCenter,
      showCalendar,
      setShowCalendar,
    }),
    [
      showSpotlight,
      toggleSpotlight,
      notesVisible,
      toggleNotes,
      hiddenNoteIds,
      hideNote,
      unhideAllNotes,
      isRevealed,
      startScreenReady,
      brightness,
      volume,
      showControlCenter,
      showCalendar,
    ]
  );

  return <OSSystemContext.Provider value={value}>{children}</OSSystemContext.Provider>;
};
