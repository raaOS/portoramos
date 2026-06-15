'use client';

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';

interface LastUpdatedContextType {
  lastUpdated: Date | null;
  setLastUpdated: (date: Date | null) => void;
}

const LastUpdatedContext = createContext<LastUpdatedContextType | undefined>(undefined);

export function LastUpdatedProvider({ children }: { children: ReactNode }) {
  const [lastUpdated, setLastUpdatedRaw] = useState<Date | null>(null);

  // Stable callback reference untuk menghindari re-render pada consumer
  const setLastUpdated = useCallback((date: Date | null) => {
    setLastUpdatedRaw(date);
  }, []);

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(() => ({ lastUpdated, setLastUpdated }), [lastUpdated, setLastUpdated]);

  return <LastUpdatedContext.Provider value={value}>{children}</LastUpdatedContext.Provider>;
}

/**
 * Hook untuk mengakses timestamp pembaruan data terakhir.
 *
 * @throws Error jika digunakan di luar `LastUpdatedProvider`.
 *
 * @example
 * ```tsx
 * const { lastUpdated, setLastUpdated } = useLastUpdated();
 * ```
 */
export function useLastUpdated(): LastUpdatedContextType {
  const context = useContext(LastUpdatedContext);

  if (context === undefined) {
    throw new Error('useLastUpdated must be used within a LastUpdatedProvider');
  }

  return context;
}
