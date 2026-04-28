import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAutoUpdateOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
}

export function useAutoUpdate<T>(
  fetchFunction: () => Promise<T>,
  options: UseAutoUpdateOptions = {}
) {
  const { interval = 5000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use ref to store fetchFunction to avoid dependency issues
  const fetchFunctionRef = useRef(fetchFunction);
  // BUG FIX #4: Mounted ref untuk mencegah setState pada unmounted component
  const isMountedRef = useRef(true);

  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFunctionRef.current();
      // BUG FIX #4: Guard setState dengan isMountedRef
      if (isMountedRef.current) {
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (err) {
      // BUG FIX #4: Guard setState dengan isMountedRef
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    } finally {
      // BUG FIX #4: Guard setState dengan isMountedRef
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []); // Empty dependency array - stable function

  useEffect(() => {
    // BUG FIX #4: Set mounted flag
    isMountedRef.current = true;
    
    let intervalId: ReturnType<typeof setInterval> | null = null;
    
    // BUG FIX #4: Defer fetchData to avoid sync setState in effect
    Promise.resolve().then(() => {
      fetchData().catch(err => {
        console.error('[useAutoUpdate] Initial fetch failed:', err);
      });
    });

    if (enabled) {
      intervalId = setInterval(() => {
        fetchData().catch(err => {
          console.error('[useAutoUpdate] Interval fetch failed:', err);
        });
      }, interval);
    }

    return () => {
      // BUG FIX #4: Set unmounted flag dan clear interval
      isMountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, interval, fetchData]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh
  };
}
