'use client';

import { useEffect, useSyncExternalStore } from 'react';

type ConnectionStatus = 'connected' | 'error' | 'checking' | 'disconnected';

interface DataStatusSnapshot {
  isLoading: boolean;
  connectionStatus: ConnectionStatus;
}

const POLL_INTERVAL_MS = 30_000;

// PERF: server snapshot harus referensi yang stabil. Object literal baru tiap
// call memicu "result of getServerSnapshot should be cached to avoid an
// infinite loop" dari useSyncExternalStore.
const SERVER_SNAPSHOT: DataStatusSnapshot = Object.freeze({
  isLoading: false,
  connectionStatus: 'checking',
});

let snapshot: DataStatusSnapshot = {
  isLoading: false,
  connectionStatus: 'checking',
};

let runtimeStarted = false;
let intervalId: number | null = null;
let inFlight: Promise<void> | null = null;

const listeners = new Set<() => void>();

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot(): DataStatusSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function publish(next: Partial<DataStatusSnapshot>) {
  const merged = { ...snapshot, ...next };
  if (
    merged.isLoading === snapshot.isLoading &&
    merged.connectionStatus === snapshot.connectionStatus
  ) {
    return;
  }
  snapshot = merged;
  listeners.forEach((listener) => listener());
}

async function checkStatusInternal() {
  if (typeof window === 'undefined') return;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      publish({ connectionStatus: 'checking' });
      const response = await fetch('/api/health');
      const data = await response.json();

      if (data.database === 'connected' && data.databaseBackend === 'cloudflare-d1') {
        publish({ isLoading: false, connectionStatus: 'connected' });
      } else {
        publish({ isLoading: false, connectionStatus: 'disconnected' });
      }
    } catch {
      publish({ isLoading: false, connectionStatus: 'error' });
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

function ensureRuntime() {
  if (typeof window === 'undefined' || runtimeStarted) return;
  runtimeStarted = true;

  void checkStatusInternal();
  intervalId = window.setInterval(() => {
    if (!document.hidden) {
      void checkStatusInternal();
    }
  }, POLL_INTERVAL_MS);
}

/**
 * Shared data-status state. Multiple admin components dapat memanggil hook ini
 * tanpa membuat ulang interval poll atau request `/api/health` ganda.
 *
 * Runtime di-start sekali saat hook dipanggil pertama kali dan dibiarkan hidup
 * selama sesi admin. Tidak ada cleanup per-unmount agar pindah halaman tidak
 * memicu polling restart yang menambah latency persepsi.
 */
export function useDataStatus() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureRuntime();
  }, []);

  return {
    isLoading: current.isLoading,
    connectionStatus: current.connectionStatus,
    deployStatus: 'idle' as const,
    checkStatus: checkStatusInternal,
    triggerSync: async () => Promise.resolve(),
    saveSettings: async () => Promise.resolve({ success: true }),
  };
}

/**
 * Manual stop, exposed for tests / sign-out flows. Production code biasanya
 * tidak perlu memanggil ini.
 */
export function stopDataStatusRuntime() {
  if (intervalId !== null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  runtimeStarted = false;
}
