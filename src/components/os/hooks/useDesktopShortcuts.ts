'use client';

import { useEffect, useRef } from 'react';
import { useOSOverlays } from '../context/OSSystemContext';

export function useDesktopShortcuts() {
  const {
    showSpotlight,
    setShowSpotlight,
    toggleSpotlight,
  } = useOSOverlays();

  const showSpotlightRef = useRef(showSpotlight);
  const toggleSpotlightRef = useRef(toggleSpotlight);
  const setShowSpotlightRef = useRef(setShowSpotlight);

  useEffect(() => {
    showSpotlightRef.current = showSpotlight;
    toggleSpotlightRef.current = toggleSpotlight;
    setShowSpotlightRef.current = setShowSpotlight;
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
