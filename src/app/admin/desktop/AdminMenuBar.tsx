'use client';

import React, { useRef, useState } from 'react';
import { Eye, LogOut, Wifi, Database, Settings, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { mutate as mutateSWR } from 'swr';
import { useDataStatus } from '../hooks/useDataStatus';
import { DatabasePopout, NetworkPopout, WatchdogPopout, SettingsPopout } from './AdminStatusPopouts';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { ActivityLogModal } from '../components/ActivityLogModal';
import {
  ClearCacheProgressModal,
  type ClearCacheProgressStep,
  type ClearCacheStepStatus,
} from '../components/ClearCacheProgressModal';
import { useToast } from '@/contexts/ToastContext';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import type { WatchdogStatusData } from './AdminStatusPopouts';

interface AdminMenuBarProps {
  onLogout: () => Promise<void>;
}

type OpenPopout = 'db' | 'net' | 'settings' | 'watchdog' | null;

type ServerCacheStep = {
  name: string;
  status: 'cleared' | 'skipped' | 'error';
  detail: string;
  entriesCleared?: number;
};

type ClearCacheResponse = {
  success?: boolean;
  message?: string;
  details?: {
    serverMemory?: ServerCacheStep[];
    nextFilesystem?: ServerCacheStep[];
    cloudflareCdn?: ServerCacheStep;
  };
};

const CACHE_STEP_DEFINITIONS: Array<Pick<ClearCacheProgressStep, 'id' | 'label'>> = [
  { id: 'serverRequest', label: 'Hubungi server admin' },
  { id: 'nextRevalidate', label: 'Revalidate cache Next.js' },
  { id: 'serverMemory', label: 'Clear in-memory cache service' },
  { id: 'nextFilesystem', label: 'Clear .next cache lokal' },
  { id: 'cloudflareCdn', label: 'Purge Cloudflare CDN/R2 edge' },
  { id: 'reactQuery', label: 'Clear React Query cache' },
  { id: 'swr', label: 'Clear SWR cache' },
  { id: 'browserCache', label: 'Clear browser Cache Storage' },
  { id: 'serviceWorker', label: 'Refresh service worker' },
  { id: 'uiRefresh', label: 'Refresh tampilan admin' },
];

function createInitialCacheSteps(): ClearCacheProgressStep[] {
  return CACHE_STEP_DEFINITIONS.map((step) => ({
    ...step,
    status: 'pending',
  }));
}

function pause(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function mapServerStatus(status?: ServerCacheStep['status']): ClearCacheStepStatus {
  if (status === 'cleared') return 'done';
  if (status === 'skipped') return 'skipped';
  if (status === 'error') return 'error';
  return 'skipped';
}

function summarizeServerSteps(steps?: ServerCacheStep[]): {
  status: ClearCacheStepStatus;
  detail: string;
} {
  if (!steps || steps.length === 0) {
    return { status: 'skipped', detail: 'Tidak ada cache terdaftar di runtime ini.' };
  }

  const errored = steps.find((step) => step.status === 'error');
  if (errored) {
    return { status: 'error', detail: `${errored.name}: ${errored.detail}` };
  }

  const skipped = steps.every((step) => step.status === 'skipped');
  if (skipped) {
    return {
      status: 'skipped',
      detail: steps.map((step) => `${step.name}: ${step.detail}`).join(' | '),
    };
  }

  const entriesCleared = steps.reduce((sum, step) => sum + (step.entriesCleared ?? 0), 0);
  return {
    status: 'done',
    detail: `${entriesCleared} entry dibersihkan dari ${steps.length} cache service.`,
  };
}

export default function AdminMenuBar({ onLogout }: AdminMenuBarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showError } = useToast();
  const csrfToken = useCsrfToken();
  const [time, setTime] = useState('');
  const [openPopout, setOpenPopout] = useState<OpenPopout>(null);
  const dbAnchorRef = useRef<HTMLButtonElement | null>(null);
  const netAnchorRef = useRef<HTMLButtonElement | null>(null);
  const watchdogAnchorRef = useRef<HTMLButtonElement | null>(null);
  const settingsAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showClearCacheProgress, setShowClearCacheProgress] = useState(false);
  const [cacheSteps, setCacheSteps] = useState<ClearCacheProgressStep[]>(createInitialCacheSteps);
  const [canCloseCacheProgress, setCanCloseCacheProgress] = useState(true);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [watchdogStatus, setWatchdogStatus] = useState<WatchdogStatusData>({
    status: 'checking',
  });
  const [isRefreshingWatchdog, setIsRefreshingWatchdog] = useState(false);

  const {
    connectionStatus,
    serverStatus,
    latencyMs,
    lastCheckedAt,
    errorMessage,
    health,
  } = useDataStatus();

  const updateCacheStep = React.useCallback(
    (id: string, patch: Partial<ClearCacheProgressStep>) => {
      setCacheSteps((current) =>
        current.map((step) => (step.id === id ? { ...step, ...patch } : step))
      );
    },
    []
  );

  const markPendingCacheStepsAsSkipped = React.useCallback((detail: string) => {
    setCacheSteps((current) =>
      current.map((step) =>
        step.status === 'pending' ? { ...step, status: 'skipped', detail } : step
      )
    );
  }, []);

  const refreshWatchdogStatus = React.useCallback(async () => {
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

  const handleClearCache = async () => {
    if (isClearingCache) return;

    setIsClearingCache(true);
    setShowClearCacheProgress(true);
    setCanCloseCacheProgress(false);
    setCacheSteps(createInitialCacheSteps());

    try {
      updateCacheStep('serverRequest', {
        status: 'running',
        detail: 'Mengirim request ke /api/admin/clear-cache...',
      });

      const res = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken || '',
        },
      });

      const data = (await res.json().catch(() => null)) as ClearCacheResponse | null;
      if (res.ok) {
        updateCacheStep('serverRequest', {
          status: 'done',
          detail: data?.message || 'Server menerima request clear cache.',
        });

        await pause(120);
        updateCacheStep('nextRevalidate', {
          status: 'done',
          detail: 'Route utama direvalidate dari server.',
        });

        await pause(120);
        const serverMemory = summarizeServerSteps(data?.details?.serverMemory);
        updateCacheStep('serverMemory', serverMemory);

        await pause(120);
        const nextFilesystem = summarizeServerSteps(data?.details?.nextFilesystem);
        updateCacheStep('nextFilesystem', nextFilesystem);

        await pause(120);
        const cdnStep = data?.details?.cloudflareCdn;
        updateCacheStep('cloudflareCdn', {
          status: mapServerStatus(cdnStep?.status),
          detail: cdnStep?.detail || 'Cloudflare CDN purge tidak tersedia.',
        });

        await pause(120);
        updateCacheStep('reactQuery', {
          status: 'running',
          detail: 'Menghapus cache TanStack Query di browser...',
        });
        queryClient.clear();
        updateCacheStep('reactQuery', {
          status: 'done',
          detail: 'React Query cache dikosongkan.',
        });

        await pause(120);
        updateCacheStep('swr', {
          status: 'running',
          detail: 'Menghapus cache SWR di browser...',
        });
        await mutateSWR(() => true, undefined, { revalidate: false });
        updateCacheStep('swr', {
          status: 'done',
          detail: 'SWR cache dikosongkan.',
        });

        await pause(120);
        updateCacheStep('browserCache', {
          status: 'running',
          detail: 'Menghapus Cache Storage browser...',
        });
        if ('caches' in window) {
          const cacheNames = await window.caches.keys();
          await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
          updateCacheStep('browserCache', {
            status: 'done',
            detail: `${cacheNames.length} browser cache storage dihapus.`,
          });
        } else {
          updateCacheStep('browserCache', {
            status: 'skipped',
            detail: 'Browser tidak mendukung Cache Storage API.',
          });
        }

        await pause(120);
        updateCacheStep('serviceWorker', {
          status: 'running',
          detail: 'Meminta service worker refresh...',
        });
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          const results = await Promise.allSettled(
            registrations.map((registration) => registration.update())
          );
          const failed = results.filter((result) => result.status === 'rejected').length;
          updateCacheStep('serviceWorker', {
            status: failed > 0 ? 'error' : 'done',
            detail:
              failed > 0
                ? `${failed} service worker gagal di-refresh.`
                : `${registrations.length} service worker di-refresh.`,
          });
        } else {
          updateCacheStep('serviceWorker', {
            status: 'skipped',
            detail: 'Browser tidak memiliki service worker aktif.',
          });
        }

        await pause(120);
        updateCacheStep('uiRefresh', {
          status: 'running',
          detail: 'Memuat ulang data admin dari server...',
        });
        router.refresh();
        updateCacheStep('uiRefresh', {
          status: 'done',
          detail: 'Admin UI sudah diminta refresh.',
        });
      } else {
        updateCacheStep('serverRequest', {
          status: 'error',
          detail: data?.message || `Server menolak request (${res.status}).`,
        });
        markPendingCacheStepsAsSkipped('Dibatalkan karena request server gagal.');
        showError('Gagal membersihkan cache');
      }
    } catch (err) {
      console.error(err);
      updateCacheStep('serverRequest', {
        status: 'error',
        detail: err instanceof Error ? err.message : 'Terjadi kesalahan internal',
      });
      markPendingCacheStepsAsSkipped('Dibatalkan karena proses sebelumnya gagal.');
      showError('Terjadi kesalahan internal');
    } finally {
      setIsClearingCache(false);
      setCanCloseCacheProgress(true);
    }
  };

  React.useEffect(() => {
    setIsOnline(navigator.onLine);

    const update = () => {
      setTime(
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 30_000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
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

  const dbColorClass =
    connectionStatus === 'connected'
      ? 'text-emerald-500'
      : connectionStatus === 'checking'
        ? 'text-amber-500'
        : 'text-rose-500';

  const netColorClass =
    !isOnline || serverStatus === 'offline'
      ? 'text-rose-500'
      : serverStatus === 'checking' || serverStatus === 'degraded'
        ? 'text-amber-500'
        : 'text-emerald-500';

  const watchdogColorClass =
    watchdogStatus.status === 'healthy'
      ? 'text-emerald-500'
      : watchdogStatus.status === 'checking' ||
          watchdogStatus.status === 'local-polling' ||
          watchdogStatus.status === 'watchdog-stale'
        ? 'text-amber-500'
        : 'text-rose-500';

  const togglePopout = (which: Exclude<OpenPopout, null>) => {
    if (which === 'watchdog') {
      void refreshWatchdogStatus();
    }
    setOpenPopout((prev) => (prev === which ? null : which));
  };

  return (
    <header className="admin-menubar">
      <div className="admin-menubar-left">
        <span className="admin-menubar-logo">◆</span>
        <span className="admin-menubar-title">Ramos Admin</span>
      </div>

      <div className="admin-menubar-right">
        <button
          ref={dbAnchorRef}
          type="button"
          onClick={() => togglePopout('db')}
          className={`admin-menubar-status-btn ${
            openPopout === 'db' ? 'admin-menubar-status-btn-active' : ''
          }`}
          title="Cloudflare D1 status"
          aria-label="Cloudflare D1 status"
          aria-expanded={openPopout === 'db'}
        >
          <Database className={`h-3.5 w-3.5 transition-colors ${dbColorClass}`} />
        </button>

        <button
          ref={netAnchorRef}
          type="button"
          onClick={() => togglePopout('net')}
          className={`admin-menubar-status-btn ${
            openPopout === 'net' ? 'admin-menubar-status-btn-active' : ''
          }`}
          title="Network status"
          aria-label="Network status"
          aria-expanded={openPopout === 'net'}
        >
          <Wifi className={`h-3.5 w-3.5 transition-colors ${netColorClass}`} />
        </button>

        {/* Telegram Watchdog Status Button */}
        <button
          ref={watchdogAnchorRef}
          type="button"
          onClick={() => togglePopout('watchdog')}
          className={`admin-menubar-status-btn ${
            openPopout === 'watchdog' ? 'admin-menubar-status-btn-active' : ''
          }`}
          title="Watchdog status"
          aria-label="Watchdog status"
          aria-expanded={openPopout === 'watchdog'}
        >
          <Bot className={`h-3.5 w-3.5 transition-colors ${watchdogColorClass}`} />
        </button>

        <span className="admin-menubar-time">{time}</span>


        <button
          onClick={() => router.push('/')}
          className="admin-menubar-btn"
          title="Lihat Website"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          ref={settingsAnchorRef}
          type="button"
          onClick={() => togglePopout('settings')}
          className={`admin-menubar-btn ${
            openPopout === 'settings' ? 'admin-menubar-status-btn-active' : ''
          }`}
          title="Pengaturan"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => void onLogout()}
          className="admin-menubar-btn admin-menubar-btn-danger"
          title="Logout"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>

      <DatabasePopout
        isOpen={openPopout === 'db'}
        onClose={() => setOpenPopout(null)}
        anchorRef={dbAnchorRef}
        status={connectionStatus}
        latencyMs={health?.databaseLatencyMs ?? null}
        apiLatencyMs={latencyMs}
        backend={health?.databaseBackend ?? null}
        lastCheckedAt={lastCheckedAt}
        errorMessage={connectionStatus === 'connected' ? null : errorMessage}
      />
      <NetworkPopout
        isOpen={openPopout === 'net'}
        onClose={() => setOpenPopout(null)}
        anchorRef={netAnchorRef}
        browserOnline={isOnline}
        serverStatus={serverStatus}
        latencyMs={latencyMs}
        lastCheckedAt={lastCheckedAt}
        errorMessage={serverStatus === 'online' ? null : errorMessage}
      />
      <WatchdogPopout
        isOpen={openPopout === 'watchdog'}
        onClose={() => setOpenPopout(null)}
        anchorRef={watchdogAnchorRef}
        status={watchdogStatus}
        onRefresh={refreshWatchdogStatus}
        isRefreshing={isRefreshingWatchdog}
      />

      <SettingsPopout
        isOpen={openPopout === 'settings'}
        onClose={() => setOpenPopout(null)}
        anchorRef={settingsAnchorRef}
        onOpenPasswordModal={() => setShowPasswordModal(true)}
        onClearCache={handleClearCache}
        onOpenActivityLog={() => setShowActivityLog(true)}
        isClearingCache={isClearingCache}
      />

      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
      <ActivityLogModal
        isOpen={showActivityLog}
        onClose={() => setShowActivityLog(false)}
      />
      <ClearCacheProgressModal
        isOpen={showClearCacheProgress}
        steps={cacheSteps}
        canClose={canCloseCacheProgress}
        onClose={() => setShowClearCacheProgress(false)}
      />
    </header>
  );
}
