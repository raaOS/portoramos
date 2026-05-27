'use client';

import React, { useRef, useState } from 'react';
import { Eye, LogOut, Wifi, Database, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDataStatus } from '../hooks/useDataStatus';
import { DatabasePopout, NetworkPopout } from './AdminStatusPopouts';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

interface AdminMenuBarProps {
  onLogout: () => Promise<void>;
}

type OpenPopout = 'db' | 'net' | 'settings' | null;

export default function AdminMenuBar({ onLogout }: AdminMenuBarProps) {
  const router = useRouter();
  const [time, setTime] = useState('');
  const [openPopout, setOpenPopout] = useState<OpenPopout>(null);
  const dbAnchorRef = useRef<HTMLButtonElement | null>(null);
  const netAnchorRef = useRef<HTMLButtonElement | null>(null);
  const settingsAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const { connectionStatus } = useDataStatus();

  React.useEffect(() => {
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
    return () => clearInterval(interval);
  }, []);

  const dbDotClass =
    connectionStatus === 'connected'
      ? 'bg-emerald-400'
      : connectionStatus === 'checking'
        ? 'bg-amber-400'
        : 'bg-rose-500';

  const togglePopout = (which: Exclude<OpenPopout, null>) => {
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
          <Database className="h-3.5 w-3.5" />
          <span className={`admin-menubar-status-dot ${dbDotClass}`} />
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
          <Wifi className="h-3.5 w-3.5" />
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
      />
      <NetworkPopout
        isOpen={openPopout === 'net'}
        onClose={() => setOpenPopout(null)}
        anchorRef={netAnchorRef}
      />

      {/* Settings Popout (Inline for simplicity) */}
      {openPopout === 'settings' && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpenPopout(null)} />
          <div
            className="absolute top-8 z-50 min-w-[200px] rounded-lg border border-white/10 bg-[#1e1e1e] shadow-2xl backdrop-blur-xl"
            style={{ right: '40px' }} // Approximate position relative to the Settings icon
          >
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Pengaturan Admin
              </div>
              <button
                onClick={() => {
                  setOpenPopout(null);
                  setShowPasswordModal(true);
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Settings size={14} />
                <span>Keamanan & Sandi</span>
              </button>
              <div className="my-1 h-px w-full bg-white/10" />
              <div className="px-3 py-2 text-xs text-gray-500 italic">
                Menu lain akan datang...
              </div>
            </div>
          </div>
        </>
      )}

      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </header>
  );
}
