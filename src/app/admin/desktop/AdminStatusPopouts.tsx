'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Database, Wifi, Cloud, Activity, Shield, Globe, Bot, Settings, RefreshCw, List } from 'lucide-react';

const popoutTransition = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 28,
  mass: 0.9,
};

const popoutInitial = { opacity: 0, y: -8, scale: 0.96, filter: 'blur(8px)' };
const popoutAnimate = { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' };
const popoutExit = { opacity: 0, y: -6, scale: 0.97, filter: 'blur(6px)' };

interface PopoutShellProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  width?: number;
}

function PopoutShell({ isOpen, onClose, anchorRef, children, width = 280 }: PopoutShellProps) {
  const popoutRef = useRef<HTMLDivElement | null>(null);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoutRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    // Defer to avoid catching the same click that opened it
    const id = window.setTimeout(() => {
      window.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose, anchorRef]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Position relative to anchor
  const [pos, setPos] = React.useState<{ top: number; right: number } | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const right = Math.max(8, window.innerWidth - rect.right);
      const top = rect.bottom + 8;
      setPos({ top, right });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, anchorRef]);

  return (
    <AnimatePresence>
      {isOpen && pos && (
        <motion.div
          ref={popoutRef}
          initial={popoutInitial}
          animate={popoutAnimate}
          exit={popoutExit}
          transition={popoutTransition}
          style={{
            position: 'fixed',
            top: pos.top,
            right: pos.right,
            width,
            zIndex: 10000,
            transformOrigin: 'top right',
          }}
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white/75 text-zinc-700 backdrop-blur-2xl"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DatabasePopoutProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  status: 'connected' | 'checking' | 'error' | 'disconnected';
  latencyMs?: number | null;
  apiLatencyMs?: number | null;
  backend?: string | null;
  lastCheckedAt?: number | null;
  errorMessage?: string | null;
}

const STATUS_LABEL: Record<DatabasePopoutProps['status'], string> = {
  connected: 'Terhubung',
  checking: 'Memeriksa…',
  error: 'Bermasalah',
  disconnected: 'Terputus',
};

const STATUS_DOT: Record<DatabasePopoutProps['status'], string> = {
  connected: 'bg-emerald-400',
  checking: 'bg-amber-400',
  error: 'bg-rose-500',
  disconnected: 'bg-slate-500',
};

const DB_REASON: Record<DatabasePopoutProps['status'], string> = {
  connected: 'Hijau karena /api/health berhasil membaca Cloudflare D1.',
  checking: 'Kuning karena admin sedang memeriksa /api/health.',
  error: 'Merah karena browser tidak bisa membaca /api/health.',
  disconnected: 'Merah karena /api/health bisa dijangkau, tapi read D1 gagal.',
};

function formatMs(value?: number | null) {
  return typeof value === 'number' ? `${value} ms` : '-';
}

function StatusLegend() {
  return (
    <div className="grid grid-cols-3 gap-1 px-2 pt-1 text-[10px] text-zinc-500">
      <span>
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
        Online
      </span>
      <span>
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
        Checking
      </span>
      <span>
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />
        Offline
      </span>
    </div>
  );
}

export function DatabasePopout({
  isOpen,
  onClose,
  anchorRef,
  status,
  latencyMs,
  apiLatencyMs,
  backend,
  lastCheckedAt,
  errorMessage,
}: DatabasePopoutProps) {
  return (
    <PopoutShell isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={300}>
      <div className="border-b border-black/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">
            <Database className="h-5 w-5 text-sky-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-800">Cloudflare D1</div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
              {STATUS_LABEL[status]}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-3 text-xs text-zinc-500">
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Cloud className="h-3.5 w-3.5 text-zinc-400" />
            Backend
          </span>
          <span className="font-medium text-zinc-700">{backend || '-'}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-zinc-400" />
            D1 latency
          </span>
          <span className="font-medium text-zinc-700">{formatMs(latencyMs)}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-zinc-400" />
            API latency
          </span>
          <span className="font-medium text-zinc-700">{formatMs(apiLatencyMs)}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-zinc-400" />
            Last check
          </span>
          <span className="font-medium text-zinc-700">{formatTime(lastCheckedAt)}</span>
        </div>
        <div className="rounded-lg bg-black/5 px-2 py-2 text-[11px] text-zinc-600">
          {DB_REASON[status]}
        </div>
        {errorMessage ? (
          <div className="rounded-lg bg-rose-50 px-2 py-2 text-[11px] text-rose-700">
            {errorMessage}
          </div>
        ) : null}
        <StatusLegend />
      </div>

      <div className="border-t border-black/5 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
        Ramos Admin · Data Plane
      </div>
    </PopoutShell>
  );
}

interface NetworkPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  browserOnline: boolean;
  serverStatus: 'online' | 'checking' | 'degraded' | 'offline';
  latencyMs?: number | null;
  lastCheckedAt?: number | null;
  errorMessage?: string | null;
}

function getNetworkView(browserOnline: boolean, serverStatus: NetworkPopoutProps['serverStatus']) {
  if (!browserOnline) {
    return {
      label: 'Browser offline',
      dot: 'bg-rose-500',
      icon: 'text-rose-500',
      reason: 'Merah karena browser melaporkan navigator.onLine=false.',
    };
  }

  if (serverStatus === 'online') {
    return {
      label: 'Online',
      dot: 'bg-emerald-400',
      icon: 'text-emerald-500',
      reason: 'Hijau karena browser online dan /api/health berhasil dijangkau.',
    };
  }

  if (serverStatus === 'checking') {
    return {
      label: 'Memeriksa API',
      dot: 'bg-amber-400',
      icon: 'text-amber-500',
      reason: 'Kuning karena admin sedang ping /api/health.',
    };
  }

  if (serverStatus === 'degraded') {
    return {
      label: 'API degraded',
      dot: 'bg-amber-400',
      icon: 'text-amber-500',
      reason: 'Kuning karena API bisa dijangkau, tapi health check melaporkan degraded.',
    };
  }

  return {
    label: 'API offline',
    dot: 'bg-rose-500',
    icon: 'text-rose-500',
    reason: 'Merah karena browser online, tapi request /api/health gagal.',
  };
}

export function NetworkPopout({
  isOpen,
  onClose,
  anchorRef,
  browserOnline,
  serverStatus,
  latencyMs,
  lastCheckedAt,
  errorMessage,
}: NetworkPopoutProps) {
  const view = getNetworkView(browserOnline, serverStatus);

  return (
    <PopoutShell isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={280}>
      <div className="border-b border-black/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">
            <Wifi className={`h-5 w-5 ${view.icon}`} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-800">Network</div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className={`h-2 w-2 rounded-full ${view.dot}`} />
              {view.label}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-3 text-xs text-zinc-500">
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-zinc-400" />
            Browser
          </span>
          <span className="font-medium text-zinc-700">
            {browserOnline ? 'online' : 'offline'}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-zinc-400" />
            API server
          </span>
          <span className="font-medium text-zinc-700">{serverStatus}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-zinc-400" />
            Latency
          </span>
          <span className="font-medium text-zinc-700">{formatMs(latencyMs)}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Wifi className="h-3.5 w-3.5 text-zinc-400" />
            Last check
          </span>
          <span className="font-medium text-zinc-700">{formatTime(lastCheckedAt)}</span>
        </div>
        <div className="rounded-lg bg-black/5 px-2 py-2 text-[11px] text-zinc-600">
          {view.reason}
        </div>
        {errorMessage ? (
          <div className="rounded-lg bg-rose-50 px-2 py-2 text-[11px] text-rose-700">
            {errorMessage}
          </div>
        ) : null}
        <StatusLegend />
      </div>

      <div className="border-t border-black/5 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
        Ramos Admin · Network
      </div>
    </PopoutShell>
  );
}

interface WatchdogPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  status: WatchdogStatusData;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export type WatchdogStatusKind =
  | 'checking'
  | 'healthy'
  | 'local-polling'
  | 'watchdog-stale'
  | 'needs-restore'
  | 'error';

export interface WatchdogStatusData {
  status: WatchdogStatusKind;
  message?: string;
  webhook?: {
    state?: 'ok' | 'not-set' | 'mismatch';
    currentUrl?: string;
    expectedUrl?: string;
    pendingUpdates?: number;
    lastErrorMessage?: string | null;
  };
  lease?: {
    active?: boolean;
    heartbeatAt?: number | null;
    expiresAt?: number | null;
    expiredAt?: number | null;
    restoreWebhookUrl?: string | null;
    previousWebhookUrl?: string | null;
  };
  watchdog?: {
    configured?: boolean;
    lastRunAt?: number | null;
    lastAction?: string | null;
    lastReason?: string | null;
    lastOk?: boolean | null;
    ageMs?: number | null;
    recent?: boolean;
  };
}

const WATCHDOG_LABEL: Record<WatchdogStatusKind, string> = {
  checking: 'Memeriksa...',
  healthy: 'Production sehat',
  'local-polling': 'Local polling aktif',
  'watchdog-stale': 'Watchdog telat',
  'needs-restore': 'Perlu restore',
  error: 'Bermasalah',
};

const WATCHDOG_DOT: Record<WatchdogStatusKind, string> = {
  checking: 'bg-amber-400',
  healthy: 'bg-emerald-400',
  'local-polling': 'bg-amber-400',
  'watchdog-stale': 'bg-amber-400',
  'needs-restore': 'bg-rose-500',
  error: 'bg-rose-500',
};

const WATCHDOG_ICON: Record<WatchdogStatusKind, string> = {
  checking: 'text-amber-500',
  healthy: 'text-emerald-500',
  'local-polling': 'text-amber-500',
  'watchdog-stale': 'text-amber-500',
  'needs-restore': 'text-rose-500',
  error: 'text-rose-500',
};

const WATCHDOG_REASON: Record<WatchdogStatusKind, string> = {
  checking: 'Kuning karena admin sedang membaca status watchdog.',
  healthy: 'Hijau karena webhook job bot OK dan external watchdog baru saja berjalan.',
  'local-polling': 'Kuning karena npm run dev sedang mengambil alih job bot di local.',
  'watchdog-stale': 'Kuning karena webhook OK, tapi external watchdog belum update baru.',
  'needs-restore': 'Merah karena webhook job bot NOT SET/MISMATCH dan perlu restore.',
  error: 'Merah karena status watchdog gagal dibaca.',
};

function formatTime(value?: number | null) {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAge(value?: number | null) {
  if (typeof value !== 'number') return '-';
  if (value < 60_000) return '<1 menit';
  return `${Math.round(value / 60_000)} menit lalu`;
}

function formatWebhookState(state?: string) {
  if (state === 'ok') return 'OK';
  if (state === 'not-set') return 'NOT SET';
  if (state === 'mismatch') return 'MISMATCH';
  return '-';
}

export function WatchdogPopout({
  isOpen,
  onClose,
  anchorRef,
  status,
  onRefresh,
  isRefreshing,
}: WatchdogPopoutProps) {
  const lastRunLabel = status.watchdog?.lastRunAt
    ? `${formatTime(status.watchdog.lastRunAt)} (${formatAge(status.watchdog.ageMs)})`
    : '-';

  return (
    <PopoutShell isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={300}>
      <div className="border-b border-black/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">
            <Bot className={`h-5 w-5 ${WATCHDOG_ICON[status.status]}`} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-800">Telegram Watchdog</div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className={`h-2 w-2 rounded-full ${WATCHDOG_DOT[status.status]}`} />
              {WATCHDOG_LABEL[status.status]}
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 disabled:opacity-50"
            disabled={isRefreshing}
            title="Refresh watchdog status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-2 p-3 text-xs text-zinc-500">
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-zinc-400" />
            Webhook
          </span>
          <span className="font-medium text-zinc-700">
            {formatWebhookState(status.webhook?.state)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-zinc-400" />
            Pending
          </span>
          <span className="font-medium text-zinc-700">
            {typeof status.webhook?.pendingUpdates === 'number'
              ? status.webhook.pendingUpdates
              : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-zinc-400" />
            Last run
          </span>
          <span className="font-medium text-zinc-700">{lastRunLabel}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Cloud className="h-3.5 w-3.5 text-zinc-400" />
            Local lease
          </span>
          <span className="font-medium text-zinc-700">
            {status.lease?.active ? `aktif sampai ${formatTime(status.lease.expiresAt)}` : 'tidak aktif'}
          </span>
        </div>
        <div className="rounded-lg bg-black/5 px-2 py-2 text-[11px] text-zinc-600">
          {WATCHDOG_REASON[status.status]}
        </div>
        {status.message || status.webhook?.lastErrorMessage ? (
          <div className="rounded-lg bg-rose-50 px-2 py-2 text-[11px] text-rose-700">
            {status.message || status.webhook?.lastErrorMessage}
          </div>
        ) : null}
        <StatusLegend />
      </div>

      <div className="flex justify-center border-t border-black/5 p-3">
        <img
          src="https://api.cron-job.org/jobs/7682218/ee129eecefaabbd6/status-7.svg"
          alt="Telegram Watchdog Status"
          className="h-5 w-auto pointer-events-none select-none rounded"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      <div className="border-t border-black/5 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
        Ramos Admin · Cron Job
      </div>
    </PopoutShell>
  );
}

interface SettingsPopoutProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  onOpenPasswordModal: () => void;
  onClearCache: () => void;
  onOpenActivityLog: () => void;
  isClearingCache: boolean;
}

export function SettingsPopout({
  isOpen,
  onClose,
  anchorRef,
  onOpenPasswordModal,
  onClearCache,
  onOpenActivityLog,
  isClearingCache
}: SettingsPopoutProps) {
  return (
    <PopoutShell isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={240}>
      <div className="p-2 space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Pengaturan Admin
        </div>

        <button
          onClick={() => {
            onClose();
            onOpenPasswordModal();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-black/5"
        >
          <Settings size={14} className="text-zinc-500" />
          <span className="font-medium">Keamanan & Sandi</span>
        </button>

        <button
          onClick={() => {
            onClose();
            onOpenActivityLog();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-black/5"
        >
          <List size={14} className="text-zinc-500" />
          <span className="font-medium">Log Aktivitas</span>
        </button>

        <div className="my-1 h-px w-full bg-black/5" />

        <button
          onClick={() => {
            if (!isClearingCache) {
              onClearCache();
              onClose();
            }
          }}
          disabled={isClearingCache}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-black/5 disabled:opacity-50"
        >
          <RefreshCw size={14} className={`text-zinc-500 ${isClearingCache ? 'animate-spin' : ''}`} />
          <span className="font-medium">{isClearingCache ? 'Membersihkan...' : 'Clear Cache'}</span>
        </button>

      </div>
    </PopoutShell>
  );
}
