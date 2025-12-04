'use client';

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';

interface NavbarVisibilityContextType {
  isNavbarVisible: boolean;
  hideNavbar: () => void;
  showNavbar: () => void;
}

const NavbarVisibilityContext = createContext<NavbarVisibilityContextType | undefined>(undefined);

export function NavbarVisibilityProvider({ children }: { children: ReactNode }) {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);

  // Memoize callback functions to prevent re-creating them on every render
  const hideNavbar = useCallback(() => setIsNavbarVisible(false), []);
  const showNavbar = useCallback(() => setIsNavbarVisible(true), []);

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ isNavbarVisible, hideNavbar, showNavbar }),
    [isNavbarVisible, hideNavbar, showNavbar]
  );

  return (
    <NavbarVisibilityContext.Provider value={value}>
      {children}
    </NavbarVisibilityContext.Provider>
  );
}

export function useNavbarVisibility() {
  const context = useContext(NavbarVisibilityContext);
  if (context === undefined) {
    throw new Error('useNavbarVisibility must be used within a NavbarVisibilityProvider');
  }
  return context;
}
