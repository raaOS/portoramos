'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface LastUpdatedContextType {
  lastUpdated: Date | null;
  setLastUpdated: (date: Date | null) => void;
}

const LastUpdatedContext = createContext<LastUpdatedContextType | undefined>(undefined);

export function LastUpdatedProvider({ children }: { children: ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ lastUpdated, setLastUpdated }),
    [lastUpdated]
  );

  return (
    <LastUpdatedContext.Provider value={value}>
      {children}
    </LastUpdatedContext.Provider>
  );
}

export function useLastUpdated() {
  const context = useContext(LastUpdatedContext);
  if (context === undefined) {
    throw new Error('useLastUpdated must be used within a LastUpdatedProvider');
  }
  return context;
}
