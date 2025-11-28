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

  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFunctionRef.current();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - stable function

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    fetchData();

    if (enabled) {
      intervalId = setInterval(fetchData, interval);
    }

    return () => {
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
