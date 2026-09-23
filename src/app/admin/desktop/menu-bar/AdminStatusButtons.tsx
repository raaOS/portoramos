'use client';

import React from 'react';
import { Eye, LogOut, Wifi, Database, Settings, Bot, CloudUpload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { OpenPopout } from './types';
import type { BackgroundUploadTask } from '@/contexts/BackgroundUploadContext';

interface AdminStatusButtonsProps {
  openPopout: OpenPopout;
  togglePopout: (which: Exclude<OpenPopout, null>) => void;
  dbAnchorRef: React.RefObject<HTMLButtonElement | null>;
  netAnchorRef: React.RefObject<HTMLButtonElement | null>;
  watchdogAnchorRef: React.RefObject<HTMLButtonElement | null>;
  uploadsAnchorRef: React.RefObject<HTMLButtonElement | null>;
  settingsAnchorRef: React.RefObject<HTMLButtonElement | null>;
  dbColorClass: string;
  netColorClass: string;
  watchdogColorClass: string;
  cloudIconColorClass: string;
  uploadTooltip: string;
  tasks: BackgroundUploadTask[];
  hasActiveUploads: boolean;
  completedUploadCount: number;
  totalUploadCount: number;
  erroredUploadCount: number;
  inFlightUploadProgress: number;
  time: string;
  onLogout: () => Promise<void>;
}

export function AdminStatusButtons({
  openPopout,
  togglePopout,
  dbAnchorRef,
  netAnchorRef,
  watchdogAnchorRef,
  uploadsAnchorRef,
  settingsAnchorRef,
  dbColorClass,
  netColorClass,
  watchdogColorClass,
  cloudIconColorClass,
  uploadTooltip,
  tasks,
  hasActiveUploads,
  completedUploadCount,
  totalUploadCount,
  erroredUploadCount,
  inFlightUploadProgress,
  time,
  onLogout,
}: AdminStatusButtonsProps) {
  const router = useRouter();

  return (
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

      <button
        ref={uploadsAnchorRef}
        type="button"
        onClick={() => togglePopout('uploads')}
        className={`admin-menubar-status-btn relative ${cloudIconColorClass} ${
          openPopout === 'uploads' ? 'admin-menubar-status-btn-active' : ''
        }`}
        title={uploadTooltip || 'Background uploads — tidak ada task aktif'}
        aria-label={
          tasks.length === 0
            ? 'Background uploads, no active tasks. Click to view panel.'
            : `Uploads ${completedUploadCount} of ${totalUploadCount} complete${
                erroredUploadCount > 0 ? `, ${erroredUploadCount} failed` : ''
              }, ${inFlightUploadProgress} percent average. Click to view details.`
        }
        aria-expanded={openPopout === 'uploads'}
      >
        <CloudUpload className={`h-3.5 w-3.5 ${hasActiveUploads ? 'animate-pulse' : ''}`} />
        {erroredUploadCount > 0 && (
          <span
            className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-1 ring-white"
            aria-hidden="true"
          />
        )}
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
  );
}
