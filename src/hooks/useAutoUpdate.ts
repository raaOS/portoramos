import { useState, useEffect, useCallback } from 'react';

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

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFunction();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

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
