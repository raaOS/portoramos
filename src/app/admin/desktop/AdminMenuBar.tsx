'use client';

import React, { useRef, useState, useSyncExternalStore, useEffect, useMemo, useCallback } from 'react';
import { useDataStatus } from '../hooks/useDataStatus';
import {
  DatabasePopout,
  NetworkPopout,
  WatchdogPopout,
  SettingsPopout,
  UploadsPopout,
} from './status-popouts';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { ActivityLogModal } from '../components/ActivityLogModal';
import { ClearCacheProgressModal } from '../components/ClearCacheProgressModal';
import { useBackgroundUpload } from '@/contexts/BackgroundUploadContext';
import {
  subscribeOnline,
  getOnlineSnapshot,
  getOnlineServerSnapshot,
} from './helpers/onlineStore';
import type { AdminMenuBarProps, OpenPopout } from './menu-bar/types';
import { useWatchdogPoller } from './menu-bar/useWatchdogPoller';
import { useClearCachePipeline } from './menu-bar/useClearCachePipeline';
import { AdminStatusButtons } from './menu-bar/AdminStatusButtons';

export default function AdminMenuBar({ onLogout }: AdminMenuBarProps) {
  const [time, setTime] = useState('');
  const [openPopout, setOpenPopout] = useState<OpenPopout>(null);
  const dbAnchorRef = useRef<HTMLButtonElement | null>(null);
  const netAnchorRef = useRef<HTMLButtonElement | null>(null);
  const watchdogAnchorRef = useRef<HTMLButtonElement | null>(null);
  const uploadsAnchorRef = useRef<HTMLButtonElement | null>(null);
  const settingsAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);

  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );

  const { hasActiveUploads, totalProgress, tasks, removeTask } = useBackgroundUpload();
  const totalUploadCount = tasks.length;
  const completedUploadCount = tasks.filter((t) => t.status === 'complete').length;
  const erroredUploadCount = tasks.filter((t) => t.status === 'error').length;
  const inFlightUploadProgress = Math.round(totalProgress);

  const hasRecentlyCompleted = !hasActiveUploads && tasks.some((t) => t.status === 'complete');
  const cloudIconColorClass = hasActiveUploads
    ? 'text-blue-500'
    : hasRecentlyCompleted
      ? 'text-emerald-500'
      : 'text-zinc-400';

  const uploadTooltip = useMemo(() => {
    if (!tasks.length) return '';
    const header = `${completedUploadCount}/${totalUploadCount} done · ${inFlightUploadProgress}% rata-rata`;
    const rows = tasks.map((t) => {
      const pct = Math.round(t.progress);
      const label =
        t.status === 'complete'
          ? '✓ done'
          : t.status === 'error'
            ? `✗ error${t.error ? ` (${t.error})` : ''}`
            : t.statusDetail
              ? `${t.status} ${pct}% — ${t.statusDetail}`
              : `${t.status} ${pct}%`;
      return `• ${t.filename} — ${label}`;
    });
    return [header, '', ...rows].join('\n');
  }, [tasks, completedUploadCount, totalUploadCount, inFlightUploadProgress]);

  const { watchdogStatus, isRefreshingWatchdog, refreshWatchdogStatus } = useWatchdogPoller();

  const { connectionStatus, serverStatus, latencyMs, lastCheckedAt, errorMessage, health } =
    useDataStatus();

  const {
    showClearCacheProgress,
    setShowClearCacheProgress,
    cacheSteps,
    canCloseCacheProgress,
    isClearingCache,
    handleClearCache,
  } = useClearCachePipeline();

  useEffect(() => {
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

    return () => {
      clearInterval(interval);
    };
  }, []);

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

  const togglePopout = useCallback((which: Exclude<OpenPopout, null>) => {
    if (which === 'watchdog') {
      void refreshWatchdogStatus();
    }
    setOpenPopout((prev) => (prev === which ? null : which));
  }, [refreshWatchdogStatus]);

  return (
    <header className="admin-menubar">
      <div className="admin-menubar-left">
        <span className="admin-menubar-logo">◆</span>
        <span className="admin-menubar-title">Ramos Admin</span>
      </div>

      <AdminStatusButtons
        openPopout={openPopout}
        togglePopout={togglePopout}
        dbAnchorRef={dbAnchorRef}
        netAnchorRef={netAnchorRef}
        watchdogAnchorRef={watchdogAnchorRef}
        uploadsAnchorRef={uploadsAnchorRef}
        settingsAnchorRef={settingsAnchorRef}
        dbColorClass={dbColorClass}
        netColorClass={netColorClass}
        watchdogColorClass={watchdogColorClass}
        cloudIconColorClass={cloudIconColorClass}
        uploadTooltip={uploadTooltip}
        tasks={tasks}
        hasActiveUploads={hasActiveUploads}
        completedUploadCount={completedUploadCount}
        totalUploadCount={totalUploadCount}
        erroredUploadCount={erroredUploadCount}
        inFlightUploadProgress={inFlightUploadProgress}
        time={time}
        onLogout={onLogout}
      />

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
      <UploadsPopout
        isOpen={openPopout === 'uploads'}
        onClose={() => setOpenPopout(null)}
        anchorRef={uploadsAnchorRef}
        tasks={tasks}
        totalProgress={totalProgress}
        onRemoveTask={removeTask}
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

      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
      <ActivityLogModal isOpen={showActivityLog} onClose={() => setShowActivityLog(false)} />
      <ClearCacheProgressModal
        isOpen={showClearCacheProgress}
        steps={cacheSteps}
        canClose={canCloseCacheProgress}
        onClose={() => setShowClearCacheProgress(false)}
      />
    </header>
  );
}
