'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Database, Wifi, Cloud, Activity, Shield, Globe } from 'lucide-react';

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

export function DatabasePopout({ isOpen, onClose, anchorRef, status }: DatabasePopoutProps) {
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
          <span className="font-medium text-zinc-700">D1 + R2</span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-zinc-400" />
            Latency
          </span>
          <span className="font-medium text-zinc-700">
            {status === 'connected' ? '~28 ms' : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-zinc-400" />
            Region
          </span>
          <span className="font-medium text-zinc-700">auto</span>
        </div>
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
}

export function NetworkPopout({ isOpen, onClose, anchorRef }: NetworkPopoutProps) {
  const [online, setOnline] = React.useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <PopoutShell isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={280}>
      <div className="border-b border-black/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5">
            <Wifi className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-800">Network</div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span
                className={`h-2 w-2 rounded-full ${
                  online ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              />
              {online ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 p-3 text-xs text-zinc-500">
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-zinc-400" />
            Status
          </span>
          <span className="font-medium text-zinc-700">{online ? 'Aktif' : 'Tidak ada koneksi'}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-black/5">
          <span className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-zinc-400" />
            Mode
          </span>
          <span className="font-medium text-zinc-700">Edge</span>
        </div>
      </div>

      <div className="border-t border-black/5 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
        Ramos Admin · Network
      </div>
    </PopoutShell>
  );
}
