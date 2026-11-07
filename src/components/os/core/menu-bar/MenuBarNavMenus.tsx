'use client';

// Menu navigasi menu bar yang "hidup": Go, Window, dan Help.
// Menggantikan label statis File/Edit/Go/Window/Help — semua item terhubung
// ke fungsi nyata (openWindow, router, reset layout, panduan pengguna).
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, Folder, House, BookUser, LayoutGrid, FileText, MessagesSquare, Minimize2, RotateCcw, HelpCircle, MonitorSmartphone, Keyboard } from 'lucide-react';
import { useTransitionRouter } from 'next-view-transitions';
import { useDesktopWindowContext } from '../../context/DesktopWindowContext';
import { soundManager } from '../../utils/SoundManager';

export interface MenuBarLabels {
  goHome: string;
  openAbout: string;
  openExplorer: string;
  projectsPage: string;
  cvPage: string;
  openChat: string;
  minimizeAll: string;
  resetLayout: string;
  noOpenWindows: string;
  quickGuide: string;
  contactMe: string;
}

/** Dropdown builder dengan pola klik-di-luar yang sama dengan MenuBarViewMenu. */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = useCallback(() => {
    soundManager.play('click');
    setOpen((prev) => !prev);
  }, []);

  return { open, setOpen, ref, toggle };
}

const triggerClass =
  'flex cursor-default items-center gap-1 rounded px-2 py-1 transition-colors hover:bg-black/5 xl:px-3';

const panelClass =
  'absolute left-0 top-full z-[1000] mt-1 min-w-[190px] rounded border border-gray-200 bg-white py-1 shadow-lg';

const itemClass =
  'flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:text-blue-600';

function DropdownTrigger({
  label,
  open,
  onClick,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <div className={triggerClass} onClick={onClick}>
      {label}
      <ChevronDown
        size={10}
        aria-hidden="true"
        className={`transition-transform ${open ? 'rotate-180' : ''}`}
      />
    </div>
  );
}

/* ────────────────────────────── Go ────────────────────────────── */

export function MenuBarGoMenu({ label, labels }: { label: string; labels: MenuBarLabels }) {
  const { open, setOpen, ref, toggle } = useDropdown();
  const router = useTransitionRouter();
  const { openWindow } = useDesktopWindowContext();

  const go = (action: () => void) => {
    soundManager.play('click');
    setOpen(false);
    action();
  };

  return (
    <div ref={ref} className="relative">
      <DropdownTrigger label={label} open={open} onClick={toggle} />
      {open && (
        <div className={panelClass}>
          <button className={itemClass} onClick={() => go(() => router.push('/'))}>
            <House size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            {labels.goHome}
          </button>
          <button className={itemClass} onClick={() => go(() => openWindow('about'))}>
            <BookUser size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            {labels.openAbout}
          </button>
          <button className={itemClass} onClick={() => go(() => openWindow('explorer'))}>
            <Folder size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            {labels.openExplorer}
          </button>
          <button className={itemClass} onClick={() => go(() => router.push('/projects'))}>
            <LayoutGrid size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            {labels.projectsPage}
          </button>
          <button className={itemClass} onClick={() => go(() => router.push('/cv'))}>
            <FileText size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            {labels.cvPage}
          </button>
          <button className={itemClass} onClick={() => go(() => openWindow('whatsapp'))}>
            <MessagesSquare size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            {labels.openChat}
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Window ───────────────────────────── */

export function MenuBarWindowMenu({ label, labels }: { label: string; labels: MenuBarLabels }) {
  const { open, setOpen, ref, toggle } = useDropdown();
  const { windows, setWindows, focusWindow, resetWindows } = useDesktopWindowContext();

  const openWindows = windows.filter((w) => w.isOpen);

  const minimizeAll = () => {
    soundManager.play('click');
    setOpen(false);
    setWindows((prev) => prev.map((w) => (w.isOpen ? { ...w, isMinimized: true } : w)));
  };

  const resetLayout = () => {
    soundManager.play('click');
    setOpen(false);
    try {
      localStorage.removeItem('ramos-positions-v2');
      sessionStorage.removeItem('ramos-session-positions');
    } catch {
      // Storage bisa saja diblokir browser — reset jendela tetap dijalankan.
    }
    resetWindows();
  };

  const focus = (id: string) => {
    soundManager.play('click');
    setOpen(false);
    focusWindow(id);
  };

  return (
    <div ref={ref} className="relative">
      <DropdownTrigger label={label} open={open} onClick={toggle} />
      {open && (
        <div className={panelClass}>
          <button className={itemClass} onClick={minimizeAll}>
            <Minimize2 size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            {labels.minimizeAll}
          </button>
          <button className={itemClass} onClick={resetLayout}>
            <RotateCcw size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            {labels.resetLayout}
          </button>
          {openWindows.length > 0 && (
            <>
              <div className="my-1 border-t border-gray-100" aria-hidden="true" />
              {openWindows.map((w) => (
                <button
                  key={w.id}
                  className={`${itemClass} ${w.isMinimized ? 'opacity-50' : ''}`}
                  onClick={() => focus(w.id)}
                >
                  <MonitorSmartphone
                    size={14}
                    className="shrink-0 text-gray-400"
                    aria-hidden="true"
                  />
                  <span className="truncate">{w.title}</span>
                  {w.isMinimized && (
                    <Check size={12} className="ml-auto text-gray-300" aria-hidden="true" />
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────── Help ────────────────────────────── */

const GUIDE_SECTIONS: Array<{ title: string; items: string[] }> = [
  {
    title: 'Cara Pakai',
    items: [
      'Dobel-klik ikon di desktop atau Explorer untuk membuka.',
      'Tarik jendela lewat bar judulnya; tarik ikon untuk menata ulang.',
      'Tombol merah kuning hijau = tutup, minimize, maximize.',
      'Klik ikon di Dock untuk membuka aplikasi.',
    ],
  },
  {
    title: 'Pintasan Keyboard',
    items: [
      'Esc — tutup lightbox / preview',
      '← → — pindah file di lightbox',
      'Space — buka file terpilih di Explorer',
    ],
  },
];

export function MenuBarHelpMenu({ label, labels }: { label: string; labels: MenuBarLabels }) {
  const { open, setOpen, ref, toggle } = useDropdown();
  const { openWindow } = useDesktopWindowContext();
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (!guideOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGuideOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [guideOpen]);

  return (
    <div ref={ref} className="relative">
      <DropdownTrigger label={label} open={open} onClick={toggle} />
      {open && (
        <div className={panelClass}>
          <button
            className={itemClass}
            onClick={() => {
              soundManager.play('click');
              setOpen(false);
              setGuideOpen(true);
            }}
          >
            <HelpCircle size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            {labels.quickGuide}
          </button>
          <button
            className={itemClass}
            onClick={() => {
              soundManager.play('click');
              setOpen(false);
              openWindow('contact');
            }}
          >
            <MessagesSquare size={14} className="shrink-0 text-gray-400" aria-hidden="true" />
            {labels.contactMe}
          </button>
        </div>
      )}

      {/* Modal Panduan Singkat */}
      {guideOpen && (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGuideOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{labels.quickGuide}</h2>
              <button
                onClick={() => setGuideOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-blue-600"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            {GUIDE_SECTIONS.map((section) => (
              <div key={section.title} className="mb-4 last:mb-0">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {section.title === 'Pintasan Keyboard' ? (
                    <Keyboard size={12} aria-hidden="true" />
                  ) : (
                    <MonitorSmartphone size={12} aria-hidden="true" />
                  )}
                  {section.title}
                </p>
                <ul className="space-y-1.5">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm leading-snug text-gray-600"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
