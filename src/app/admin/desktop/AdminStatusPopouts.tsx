'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Database, Wifi, Cloud, Activity, Shield, Globe, Bot, Settings, RefreshCw, List, HardDrive, Image as ImageIcon, Film, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { useStorageStats, type StorageCategoryStats, type StorageStatsState } from '../hooks/useStorageStats';

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

  // Position relative to anchor.
  //
  // Default: center the popout under the anchor (so a database / wifi
  // icon in the menu bar always blooms straight downward), but clamp
  // the result to keep the popout fully within the viewport. Without
  // the clamp, an anchor near a viewport edge can push the popout off
  // screen; without the centering, an anchor in the middle of the
  // menu bar leaves the popout flush-right and can overlap unrelated
  // desktop UI sitting under that side.
  //
  // On narrow viewports (mobile / small tablet portrait) the requested
  // `width` may itself exceed the viewport. We collapse to a viewport-
  // aware width with margins on both sides so the popout stays usable
  // instead of getting clipped or overflowing under the desktop chrome.
  const [pos, setPos] = React.useState<{
    top: number;
    left: number;
    width: number;
    transformOrigin: string;
  } | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;

      const margin = 8;
      const maxAvailable = Math.max(160, window.innerWidth - margin * 2);
      const effectiveWidth = Math.min(width, maxAvailable);

      const anchorCenter = rect.left + rect.width / 2;
      const desiredLeft = anchorCenter - effectiveWidth / 2;
      const maxLeft = window.innerWidth - effectiveWidth - margin;
      const left = Math.min(Math.max(margin, desiredLeft), Math.max(margin, maxLeft));
      const top = rect.bottom + margin;

      // Anchor the scale animation to the side closest to the anchor,
      // so the popout still feels like it's "growing out of" the icon
      // even after the clamp shifts the popout sideways.
      const popoutCenter = left + effectiveWidth / 2;
      const offset = anchorCenter - popoutCenter;
      let originX: string;
      if (offset > effectiveWidth / 4) originX = 'right';
      else if (offset < -effectiveWidth / 4) originX = 'left';
      else originX = 'center';

      setPos({ top, left, width: effectiveWidth, transformOrigin: `top ${originX}` });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, anchorRef, width]);

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
            left: pos.left,
            width: pos.width,
            // Cap height so a tall popout (Database with Storage panel
            // expanded) doesn't run past the bottom of a short mobile
            // viewport. The inner content scrolls within the popout.
            maxHeight: `calc(100dvh - ${pos.top + 8}px)`,
            zIndex: 10000,
            transformOrigin: pos.transformOrigin,
            overflowX: 'hidden',
            overflowY: 'auto',
          }}
          className="rounded-xl border border-zinc-200 bg-white/75 text-zinc-700 backdrop-blur-2xl"
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
  // Lazy-load storage stats only while the popout is open. The endpoint
  // hits R2 ListObjectsV2 so we don't want it firing during normal admin
  // browsing — only when an admin actively peeks at the panel.
  const { state: storageState, refresh: refreshStorage } = useStorageStats({
    enabled: isOpen,
  });

  return (
    <PopoutShell isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={340}>
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
        <StorageBreakdownSection state={storageState} onRefresh={() => void refreshStorage(true)} />
        <StatusLegend />
      </div>

      <div className="border-t border-black/5 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
        Ramos Admin · Data Plane
      </div>
    </PopoutShell>
  );
}

// ---------------------------------------------------------------------------
// Storage breakdown
// ---------------------------------------------------------------------------

interface StorageBreakdownSectionProps {
  state: StorageStatsState;
  onRefresh: () => void;
}

function StorageBreakdownSection({ state, onRefresh }: StorageBreakdownSectionProps) {
  // The hook keeps the previous payload around during loading and on
  // error, so we can show stale-but-useful numbers instead of flashing
  // an empty grid every refresh.
  const data =
    state.status === 'ready'
      ? state.data
      : state.status === 'loading' || state.status === 'error'
        ? state.data
        : null;

  const isLoading = state.status === 'loading';
  const isError = state.status === 'error';
  const [showGlossary, setShowGlossary] = React.useState(false);

  return (
    <div className="rounded-lg border border-black/5 bg-white/40 p-2">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-700">
          <HardDrive className="h-3.5 w-3.5 text-zinc-500" />
          Storage breakdown
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowGlossary((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-colors ${
              showGlossary ? 'text-blue-600' : 'text-zinc-500 hover:text-blue-600'
            }`}
            title="Bantuan istilah"
            aria-label="Toggle istilah"
            aria-expanded={showGlossary}
          >
            <HelpCircle className="h-3 w-3" />
            Help
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-zinc-500 transition-colors hover:text-blue-600 disabled:opacity-50 disabled:hover:text-zinc-500"
            title="Refresh stats"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {showGlossary && <StorageGlossary />}

      {isError && (
        <div className="mx-1 mb-2 rounded-md bg-rose-50 px-2 py-1.5 text-[10px] text-rose-700">
          {state.message}
        </div>
      )}

      {!data && !isLoading && !isError && (
        <div className="px-1 py-1 text-[10px] text-zinc-500">
          Buka popout untuk memuat ringkasan storage.
        </div>
      )}

      {data && data.categories.length === 0 && (
        <div className="px-1 py-1 text-[10px] text-zinc-500">
          Belum ada kategori yang terdaftar.
        </div>
      )}

      {data && data.categories.length > 0 && (
        <ul className="space-y-1.5">
          {data.categories.map((cat) => (
            <StorageCategoryRow key={cat.id} category={cat} />
          ))}
        </ul>
      )}

      {data && data.warnings.length > 0 && (
        <div className="mt-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
          <div className="flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3 w-3" />
            Warnings
          </div>
          <ul className="mt-0.5 list-disc pl-3">
            {data.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StorageGlossary() {
  return (
    <div className="mb-1.5 rounded-md border border-blue-100 bg-blue-50/60 px-2 py-1.5 text-[10px] leading-relaxed text-blue-900">
      <div className="mb-1 font-semibold">Istilah singkat</div>
      <dl className="space-y-1">
        <div>
          <dt className="inline font-semibold">D1: </dt>
          <dd className="inline">jumlah URL yang tercatat di database (apa yang admin pilih: cover, gallery, before/after, wallpaper).</dd>
        </div>
        <div>
          <dt className="inline font-semibold">R2: </dt>
          <dd className="inline">jumlah file fisik di bucket. Bisa lebih banyak dari D1 karena ada file pendamping (preview clip + poster) yang dibuat otomatis untuk tiap video.</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Side-car: </dt>
          <dd className="inline">file pendamping yang dibuat otomatis: <code className="rounded bg-white/70 px-1">{'<nama>'}-preview.mp4</code> + <code className="rounded bg-white/70 px-1">{'<nama>'}.jpg</code>. Tidak dicatat di D1, tapi dipakai UI lewat naming convention.</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Orphan: </dt>
          <dd className="inline">file di R2 yang tidak ada referensinya di D1. Biasanya sisa upload gagal atau project lama yang sudah dihapus tapi asset-nya ketinggalan.</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Dangling: </dt>
          <dd className="inline">URL di D1 yang file-nya sudah tidak ada di R2. Biasanya akibat file dihapus manual dari bucket.</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Sync: </dt>
          <dd className="inline">tidak ada orphan dan tidak ada dangling. Jumlah D1 vs R2 boleh beda asal selisihnya bisa dijelaskan oleh side-car.</dd>
        </div>
      </dl>
    </div>
  );
}

interface StorageCategoryRowProps {
  category: StorageCategoryStats;
}

function StorageCategoryRow({ category }: StorageCategoryRowProps) {
  const hasMismatch = category.orphans > 0 || category.dangling > 0;
  const [showNote, setShowNote] = React.useState(false);

  return (
    <li className="rounded-md px-1.5 py-1.5 transition-colors hover:bg-black/5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[11px] font-medium text-zinc-700" title={category.prefix}>
          {category.label}
        </span>
        <div className="flex items-center gap-1.5">
          {category.note && (
            <NoteHint
              text={category.note}
              isOpen={showNote}
              onToggle={() => setShowNote((v) => !v)}
              onClose={() => setShowNote(false)}
            />
          )}
          {hasMismatch ? (
            <span
              className="flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-800"
              title={`${category.orphans} orphan, ${category.dangling} dangling`}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              mismatch
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
              sync
            </span>
          )}
        </div>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-1.5 text-[10px] text-zinc-500">
        <div
          className="rounded bg-black/[0.03] px-1.5 py-1"
          title="D1 = jumlah URL yang admin pilih (cover, gallery, wallpaper, dll.)."
        >
          <div className="text-[9px] uppercase tracking-wider text-zinc-400">
            D1 <span className="font-normal normal-case text-zinc-400/80">database</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-700">
            <span title="Total URL tercatat">{category.d1.total}</span>
            <span className="flex items-center gap-0.5 text-zinc-500" title={`${category.d1.image} image`}>
              <ImageIcon className="h-2.5 w-2.5" />
              {category.d1.image}
            </span>
            <span className="flex items-center gap-0.5 text-zinc-500" title={`${category.d1.video} video`}>
              <Film className="h-2.5 w-2.5" />
              {category.d1.video}
            </span>
          </div>
        </div>
        <div
          className="rounded bg-black/[0.03] px-1.5 py-1"
          title={
            category.sidecarCount > 0
              ? `R2 = file fisik di bucket. Termasuk ${category.sidecarCount} file pendamping (preview/poster) yang otomatis dibuat untuk video.`
              : 'R2 = file fisik di bucket.'
          }
        >
          <div className="text-[9px] uppercase tracking-wider text-zinc-400">
            R2 <span className="font-normal normal-case text-zinc-400/80">bucket</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-700">
            <span title="Total object di prefix">{category.r2.total}</span>
            <span className="flex items-center gap-0.5 text-zinc-500" title={`${category.r2.image} image`}>
              <ImageIcon className="h-2.5 w-2.5" />
              {category.r2.image}
            </span>
            <span className="flex items-center gap-0.5 text-zinc-500" title={`${category.r2.video} video`}>
              <Film className="h-2.5 w-2.5" />
              {category.r2.video}
            </span>
          </div>
        </div>
      </div>

      {hasMismatch && (
        <div className="mt-1 flex flex-wrap gap-2 text-[9px] text-amber-800">
          {category.orphans > 0 && (
            <span title="Object di R2 tanpa referensi D1 — kandidat untuk dihapus.">
              {category.orphans} orphan
            </span>
          )}
          {category.dangling > 0 && (
            <span title="URL di D1 yang object-nya hilang dari R2.">
              {category.dangling} dangling
            </span>
          )}
        </div>
      )}
    </li>
  );
}

interface NoteHintProps {
  text: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/**
 * Compact "i" icon next to the SYNC/MISMATCH badge. The category note
 * is rendered as a hover/click popover so the popout stays clean while
 * still keeping the explanation one keystroke away. The popover is
 * absolute-positioned within the row so it doesn't reflow other rows
 * while open.
 */
function NoteHint({ text, isOpen, onToggle, onClose }: NoteHintProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Click outside to close (only relevant when toggled via click; hover
  // state already closes on mouseleave).
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const id = window.setTimeout(() => {
      window.addEventListener('mousedown', handler);
    }, 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose]);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => !isOpen && onToggle()}
      onMouseLeave={() => isOpen && onToggle()}
    >
      <button
        type="button"
        onClick={(e) => {
          // Allow click-to-pin on touch / keyboard users; desktop hover
          // behavior still works because mouseenter already opened it.
          e.stopPropagation();
          onToggle();
        }}
        className={`inline-flex items-center justify-center transition-colors ${
          isOpen ? 'text-blue-600' : 'text-zinc-400 hover:text-blue-600'
        }`}
        title="Penjelasan kategori"
        aria-label="Penjelasan kategori"
        aria-expanded={isOpen}
      >
        <Info className="h-3 w-3" />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute right-0 top-full z-20 mt-1 max-w-[min(15rem,calc(100vw-2rem))] rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[10px] leading-snug text-zinc-600 shadow-lg"
          style={{ width: 'max-content' }}
        >
          {text}
        </div>
      )}
    </div>
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
