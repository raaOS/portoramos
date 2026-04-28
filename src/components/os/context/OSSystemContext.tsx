"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface OSSystemContextType {
  // Spotlight visibility
  showSpotlight: boolean;
  setShowSpotlight: (show: boolean) => void;
  toggleSpotlight: () => void;
  
  // Sticky notes visibility
  notesVisible: boolean;
  setNotesVisible: (visible: boolean) => void;
  toggleNotes: () => void;
  
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
    throw new Error("useOSSystem must be used within OSSystemProvider");
  }
  return context;
};

interface OSSystemProviderProps {
  children: ReactNode;
}

export const OSSystemProvider: React.FC<OSSystemProviderProps> = ({ children }) => {
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [notesVisible, setNotesVisible] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [startScreenReady, setStartScreenReady] = useState(false);

  const toggleSpotlight = useCallback(() => setShowSpotlight(prev => !prev), []);
  const toggleNotes = useCallback(() => setNotesVisible(prev => !prev), []);

  const value = React.useMemo(() => ({
    showSpotlight,
    setShowSpotlight,
    toggleSpotlight,
    notesVisible,
    setNotesVisible,
    toggleNotes,
    isRevealed,
    setIsRevealed,
    startScreenReady,
    setStartScreenReady
  }), [
    showSpotlight, toggleSpotlight, 
    notesVisible, toggleNotes,
    isRevealed, startScreenReady
  ]);

  return (
    <OSSystemContext.Provider value={value}>
      {children}
    </OSSystemContext.Provider>
  );
};
