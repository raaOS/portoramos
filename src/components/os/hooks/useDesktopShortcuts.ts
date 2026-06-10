'use client';

import { useEffect, useRef } from 'react';
import { useOSSystem } from '../context/OSSystemContext';

export function useDesktopShortcuts() {
  const {
    showSpotlight,
    setShowSpotlight,
    toggleSpotlight,
    showMissionControl,
    setShowMissionControl,
    toggleMissionControl,
  } = useOSSystem();

  const showSpotlightRef = useRef(showSpotlight);
  const showMissionControlRef = useRef(showMissionControl);
  const toggleSpotlightRef = useRef(toggleSpotlight);
  const toggleMissionControlRef = useRef(toggleMissionControl);
  const setShowSpotlightRef = useRef(setShowSpotlight);
  const setShowMissionControlRef = useRef(setShowMissionControl);

  useEffect(() => {
    showSpotlightRef.current = showSpotlight;
    showMissionControlRef.current = showMissionControl;
    toggleSpotlightRef.current = toggleSpotlight;
    toggleMissionControlRef.current = toggleMissionControl;
    setShowSpotlightRef.current = setShowSpotlight;
    setShowMissionControlRef.current = setShowMissionControl;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.code === 'KeyK' || e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        toggleSpotlightRef.current();
      }
      if (e.key === 'Escape' && showSpotlightRef.current) {
        setShowSpotlightRef.current(false);
      }
      if (e.key === 'F3') {
        e.preventDefault();
        toggleMissionControlRef.current();
      }
      if (e.key === 'Escape' && showMissionControlRef.current) {
        setShowMissionControlRef.current(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
