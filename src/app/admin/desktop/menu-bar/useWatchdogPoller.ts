'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WatchdogStatusData } from '../status-popouts';

export function useWatchdogPoller() {
  const [watchdogStatus, setWatchdogStatus] = useState<WatchdogStatusData>({
    status: 'checking',
  });
  const [isRefreshingWatchdog, setIsRefreshingWatchdog] = useState(false);

  const refreshWatchdogStatus = useCallback(async () => {
    setIsRefreshingWatchdog(true);
    try {
      const res = await fetch('/api/admin/telegram-watchdog-status', {
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => null)) as WatchdogStatusData | null;

      if (!res.ok || !data) {
        setWatchdogStatus({
          status: 'error',
          message: data?.message || `Status request failed (${res.status})`,
        });
        return;
      }

      setWatchdogStatus(data);
    } catch (error) {
      setWatchdogStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Gagal membaca status watchdog',
      });
    } finally {
      setIsRefreshingWatchdog(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshWatchdogStatus();
    }, 0);
    const interval = window.setInterval(() => {
      void refreshWatchdogStatus();
    }, 60_000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [refreshWatchdogStatus]);

  return {
    watchdogStatus,
    isRefreshingWatchdog,
    refreshWatchdogStatus,
  };
}
