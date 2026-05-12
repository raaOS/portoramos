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

  // Keep latest fetch function tanpa trigger effect rerun
  const fetchFunctionRef = useRef(fetchFunction);
  const isMountedRef = useRef(true);

  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFunctionRef.current();
      if (isMountedRef.current) {
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    // DUPLICATE FETCH FIX: Kick off initial fetch SEKALI via microtask,
    // lalu start interval HANYA setelah initial fetch selesai. Sebelumnya
    // microtask + setInterval bisa overlap (initial fetch + interval tick
    // bareng) sehingga ada dua request sia-sia di mount.
    queueMicrotask(() => {
      if (cancelled) return;

      fetchData()
        .catch(err => console.error('[useAutoUpdate] Initial fetch failed:', err))
        .finally(() => {
          if (cancelled || !enabled || !isMountedRef.current) return;
          intervalId = setInterval(() => {
            fetchData().catch(err => {
              console.error('[useAutoUpdate] Interval fetch failed:', err);
            });
          }, interval);
        });
    });

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [enabled, interval, fetchData]);

  const refresh = useCallback(() => {
    if (isMountedRef.current) setLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}
