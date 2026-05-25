'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  m,
  useMotionValue,
  useTransform,
  useSpring,
  MotionValue,
  AnimatePresence,
} from 'motion/react';
import { useSystemSound } from '@/hooks/useSystemSound';
import type { AboutData, DockPreferences } from '@/types/about';
// next-view-transitions/Link wraps next/link tapi auto-trigger
// document.startViewTransition() di setiap klik. Tanpa ini, slide animation
// antara halaman tidak akan jalan saat user klik dock dari /projects ke
// /?app=about (atau route OS lain). useLinkStatus tetap dari next/link
// karena hook ini context-based dan kompatibel dengan kedua varian.
import { Link } from 'next-view-transitions';
import { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransitionRouter } from 'next-view-transitions';
import { Grid, User, Mail, FileText, Trash2 } from 'lucide-react';
import AppIcon from '../ui/AppIcon';
import WhatsAppIcon from '../ui/WhatsAppIcon';
import DockProjectModes from '../ui/DockProjectModes';
import { useWindowContext } from '@/contexts/WindowContext';
import { getDockItemConfig } from '../utils/dockUtils';
import { markBack } from '@/lib/navigationDirection';
import { Z_LAYERS } from '../utils/zIndexLayers';

const LINK_BOUNCE_DELAY_MS = 280;

/**
 * Dock implementation — single source untuk semua varian.
 *
 * Tiga ekspor:
 *   - default `Dock`        — komponen presentational (icons + glass material)
 *   - named  `OSDock`       — wrapper untuk route OS desktop (`/`)
 *   - named  `GlobalDock`   — wrapper untuk route non-OS (`/projects`, dst)
 *
 * OSDock dan GlobalDock mutually exclusive: OSDock dipasang dari
 * UIOverlaysLayer di route `/`, GlobalDock dipasang dari NonOSChrome
 * di route lain (return null saat di `/`).
 *
 * Pattern penting yang harus dipertahankan:
 * - Items yang menavigasi ke route lain harus mengirim `href`. Dock akan
 *   membungkus item dengan `<Link prefetch>` untuk navigasi + prefetch
 *   bawaan Next.js. `onClick` dijalankan SEBELUM Link push (mis. untuk
 *   `markBack()`), navigasi sendiri dilakukan oleh Link — JANGAN memanggil
 *   `router.push` di `onClick` lagi (akan double-navigate).
 * - Items tanpa `href` (mis. di OSDock saat sudah di route `/`) memakai
 *   tombol biasa: klik langsung memanggil `onClick` (mis. `openWindow`)
 *   tanpa mengubah URL.
 * - Popover (mis. Project mode selector) memakai state terpusat di Dock,
 *   bukan per-item, supaya outside-click handler hanya satu listener.
 */

interface DockItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  onActivate: () => void;
  href?: string;
  mouseX: MotionValue<number>;
  shouldBounceExternal?: boolean;
  isMobile?: boolean;
  popoverContent?: React.ReactNode;
  isPopoverOpen: boolean;
  onTogglePopover: () => void;
  anyPopoverOpen: boolean;
}

function DockItem({
  id,
  icon,
  label,
  onActivate,
  href,
  mouseX,
  shouldBounceExternal = false,
  isMobile = false,
  popoverContent,
  isPopoverOpen,
  onTogglePopover,
  anyPopoverOpen,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useTransitionRouter();
  const { playPop } = useSystemSound();
  // Aman dipanggil di luar <Link>: Next.js mengembalikan { pending: false }
  // ketika tidak ada Link parent.
  const { pending } = useLinkStatus();

  // Bounds harus dihitung per-frame: saat satu item magnifies, item-item
  // tetangga visualnya bergeser. Cache statis akan membuat magnifikasi
  // terasa kaku karena distance dihitung pakai posisi awal. N=6 item,
  // getBoundingClientRect modern di-batch dengan layout pass Framer
  // Motion — cost-nya tidak signifikan dibanding visual quality yang
  // hilang kalau bounds di-cache.
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const baseWidth = isMobile ? 48 : 64;
  const hoverScaleMultiplier = isMobile ? 1 : 1.6;
  const scaleSync = useTransform(distance, [-100, 0, 100], [1, hoverScaleMultiplier, 1]);
  const springScale = useSpring(scaleSync, { mass: 0.1, stiffness: 250, damping: 20 });
  const width = useTransform(springScale, (s) => (anyPopoverOpen ? baseWidth : s * baseWidth));
  const height = useTransform(springScale, (s) => (anyPopoverOpen ? baseWidth : s * baseWidth));

  const [bounceKey, setBounceKey] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);

  useEffect(() => {
    if (!isBouncing) return;
    const timer = setTimeout(() => setIsBouncing(false), 1000);
    return () => clearTimeout(timer);
  }, [isBouncing]);

  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);

  const triggerLocalFeedback = useCallback(() => {
    playPop();
    setIsBouncing(true);
    setBounceKey((prev) => prev + 1);
  }, [playPop]);

  const isLinkWrapped = !!href;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (popoverContent) {
        // Popover: jangan navigate, hanya toggle.
        e.preventDefault();
        e.stopPropagation();
        onTogglePopover();
        return;
      }

      if (isLinkWrapped && href) {
        const shouldUseNativeNavigation =
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

        if (!shouldUseNativeNavigation) {
          // Delay pendek supaya bounce terlihat sebelum route change membuat dock unmount.
          e.preventDefault();
          e.stopPropagation();
          triggerLocalFeedback();
          onActivate();

          if (navigationTimerRef.current) {
            clearTimeout(navigationTimerRef.current);
          }

          navigationTimerRef.current = setTimeout(() => {
            router.push(href);
          }, LINK_BOUNCE_DELAY_MS);
          return;
        }
      }

      // Item biasa: jalankan feedback + onActivate. Link modified-click tetap native.
      triggerLocalFeedback();
      onActivate();
    },
    [href, isLinkWrapped, onActivate, onTogglePopover, popoverContent, router, triggerLocalFeedback]
  );

  // Hanya menangani Enter/Space lokal. Arrow navigation diurus di toolbar
  // level supaya tetap jalan saat focus berada di <Link> anchor parent
  // (event tidak bubble ke React handler m.div di dalamnya).
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (popoverContent && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onTogglePopover();
        return;
      }

      if (!isLinkWrapped && (e.key === 'Enter' || e.key === ' ')) {
        // Anchor menangani Enter/Space natively (browser men-dispatch
        // click → handleClick di m.div tetap jalan via bubble). Untuk
        // varian button kita aktifkan manual.
        e.preventDefault();
        triggerLocalFeedback();
        onActivate();
      }
    },
    [popoverContent, onTogglePopover, isLinkWrapped, triggerLocalFeedback, onActivate]
  );

  const activeBounce = isBouncing || shouldBounceExternal;

  return (
    <m.div
      key={`${id}-${bounceKey}`}
      id={`dock-item-${id}`}
      ref={ref}
      data-dock-item="true"
      // Saat dibungkus Link, anchor adalah elemen interaktif sebenarnya.
      // m.div jadi presentational supaya tidak ada "interactive nested
      // in interactive" (a11y violation) dan tidak duplikat focus stop.
      data-dock-focusable={isLinkWrapped ? undefined : 'true'}
      style={
        isMobile ? { width: 48, height: 48 } : { width, height, transformOrigin: 'center bottom' }
      }
      animate={
        activeBounce
          ? {
              y: isMobile ? [0, -10, 0, -7, 0, -3, 0] : [0, -18, 0, -12, 0, -5, 0],
              scaleX: isMobile ? [1, 0.9, 1.1, 1] : undefined,
              scaleY: isMobile ? [1, 1.2, 0.9, 1] : undefined,
            }
          : { y: 0 }
      }
      transition={
        activeBounce
          ? {
              duration: 0.85,
              times: [0, 0.14, 0.28, 0.45, 0.62, 0.8, 1],
              ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn', 'easeOut', 'easeIn'],
            }
          : { type: 'spring', mass: 0.1, stiffness: 250, damping: 20 }
      }
      onClick={handleClick}
      className="group relative flex aspect-square shrink-0 cursor-pointer items-center justify-center rounded-[18px] outline-none transition-[filter] duration-200 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      role={isLinkWrapped ? undefined : 'button'}
      aria-label={isLinkWrapped ? undefined : label}
      aria-haspopup={popoverContent ? 'menu' : undefined}
      aria-expanded={popoverContent ? isPopoverOpen : undefined}
      tabIndex={isLinkWrapped ? -1 : 0}
      onKeyDown={handleKeyDown}
    >
      {!isMobile && !isPopoverOpen && (
        <div className="pointer-events-none absolute -top-12 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded border border-black/5 bg-white px-2 py-1 text-[10px] font-medium text-black opacity-0 transition-opacity group-hover:opacity-100">
          {label}
        </div>
      )}

      <AnimatePresence>
        {isPopoverOpen && popoverContent && (
          <m.div
            initial={{ opacity: 0, y: 10, scale: 0.8, x: '-50%' }}
            animate={{ opacity: 1, y: -20, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 10, scale: 0.8, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{ zIndex: Z_LAYERS.DOCK_POPOVER }}
            className="absolute bottom-full left-1/2 mb-4 rounded-2xl border border-white/40 bg-zinc-100 ring-1 ring-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {React.cloneElement(popoverContent as React.ReactElement<{ onSelect?: () => void }>, {
              onSelect: onTogglePopover,
            })}
            <div className="absolute bottom-[-6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-white/40 bg-zinc-100" />
          </m.div>
        )}
      </AnimatePresence>

      {/* Premium Navigation Hint (Loading Ring) — hanya aktif kalau ada Link parent */}
      <AnimatePresence>
        {pending && (
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0 z-0 rounded-2xl bg-black/10 ring-1 ring-black/20"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-[18px]">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: 'w-full h-full',
        })}
      </div>
    </m.div>
  );
}

export interface DockItemData {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  /** Jika diisi, item akan dirender di dalam <Link> dengan prefetch. */
  href?: string;
  isOpen?: boolean;
  popoverContent?: React.ReactNode;
}

interface DockProps {
  items: DockItemData[];
  bouncingId?: string | null;
  isMobile?: boolean;
}

export default function Dock({ items, bouncingId, isMobile = false }: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const [isMounted, setIsMounted] = useState(false);
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

  // Stable callback (functional setState). Sebelumnya callback recreated setiap
  // render → DockItem.useEffect ngedaftar/clean-up window listener berkali-kali.
  const togglePopover = useCallback((id: string) => {
    setActivePopoverId((prev) => (prev === id ? null : id));
  }, []);

  const closePopover = useCallback(() => {
    setActivePopoverId(null);
  }, []);

  const anyPopoverOpen = activePopoverId !== null;

  // Reset magnifikasi saat popover terbuka — hanya satu efek di parent,
  // bukan satu listener per item.
  useEffect(() => {
    if (anyPopoverOpen) mouseX.set(Infinity);
  }, [anyPopoverOpen, mouseX]);

  // Outside click untuk menutup popover — single listener di parent Dock.
  useEffect(() => {
    if (!anyPopoverOpen) return;
    const handleOutside = () => closePopover();
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, [anyPopoverOpen, closePopover]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const dockBaseWidth = items.length > 0 ? items.length * 64 + (items.length - 1) * 8 + 24 : 0;
  const hoverCaptureWidth = dockBaseWidth + 160;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (anyPopoverOpen) return;
      mouseX.set(e.clientX);
    },
    [anyPopoverOpen, mouseX]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(Infinity);
  }, [mouseX]);

  // Arrow navigation di tingkat toolbar — bekerja konsisten baik untuk
  // tombol biasa maupun item yang dibungkus <Link>. focus berpindah antar
  // elemen yang ditandai data-dock-focusable.
  const handleToolbarKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const toolbar = e.currentTarget;
    const focusables = Array.from(
      toolbar.querySelectorAll<HTMLElement>('[data-dock-focusable="true"]')
    );
    if (focusables.length === 0) return;
    const active = document.activeElement as HTMLElement | null;
    const idx = focusables.findIndex((el) => el === active || el.contains(active));
    if (idx === -1) return;
    e.preventDefault();
    const next =
      e.key === 'ArrowRight'
        ? focusables[Math.min(idx + 1, focusables.length - 1)]
        : focusables[Math.max(idx - 1, 0)];
    next?.focus();
  }, []);

  const togglePopoverHandlers = useMemo(() => {
    const map: Record<string, () => void> = {};
    for (const item of items) {
      map[item.id] = () => togglePopover(item.id);
    }
    return map;
  }, [items, togglePopover]);

  if (!isMounted) {
    // Static placeholder during SSR; mencegah hydration mismatch karena
    // initial state Framer Motion berbeda antara server dan client.
    return <div className="print:hidden" style={{ opacity: 0 }} aria-hidden="true" />;
  }

  return (
    <div className="print:hidden">
      <m.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      >
        {/* Hit-area transparan: capture mouse move di atas konten halaman
                    (mis. masonry grid) supaya magnifikasi tetap bekerja terlepas
                    dari stacking context. Hanya mode desktop. */}
        {!isMobile && (
          <div
            className="fixed bottom-0 left-1/2 h-28 -translate-x-1/2 cursor-default"
            style={{
              width: hoverCaptureWidth,
              pointerEvents: anyPopoverOpen ? 'none' : 'auto',
              background: 'transparent',
              zIndex: Z_LAYERS.DOCK,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            aria-hidden="true"
          />
        )}
        <nav
          data-dock-toolbar="true"
          className={`pointer-events-auto relative ${isMobile ? 'max-w-[90vw]' : ''}`}
          style={{ zIndex: Z_LAYERS.DOCK }}
          role="toolbar"
          aria-label="Application dock"
          aria-orientation="horizontal"
          onKeyDown={handleToolbarKeyDown}
          // Hit-area dan nav menangani region berbeda, BUKAN duplikat:
          //   - Hit-area: cursor mendekati dock dari atas/samping
          //     (magnifikasi "approach" sebelum cursor masuk dock).
          //   - Nav: cursor berada di atas icon row. Icon punya
          //     pointer-events sendiri, mouseMove tidak bubble ke
          //     hit-area (sibling, bukan ancestor). Tanpa handler di
          //     sini, magnifikasi mati saat cursor di atas icon.
          onMouseMove={isMobile ? undefined : handleMouseMove}
          onMouseLeave={isMobile ? undefined : handleMouseLeave}
        >
          {/* iOS-style transparent glass without blur: translucent layers, border, and shadow only. */}
          <div
            className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[28px] ${
              isMobile ? 'h-[72px]' : 'h-[96px]'
            }`}
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0.24) 46%, rgba(255,255,255,0.16) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.52)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.72), inset 0 -1px 0 rgba(0,0,0,0.08), 0 18px 46px rgba(0,0,0,0.28)',
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.35),transparent_58%)]" />
          </div>

          {/* Icon row */}
          <div
            className={`relative z-10 flex items-end ${
              isMobile
                ? 'scrollbar-hide h-[72px] gap-5 overflow-x-auto px-5 py-3'
                : 'h-[96px] gap-2 px-3 py-4'
            }`}
            style={{
              minWidth: isMobile ? 'auto' : dockBaseWidth,
            }}
          >
            {items.map((item) => {
              const dockItem = (
                <DockItem
                  key={item.id}
                  id={item.id}
                  icon={item.icon}
                  label={item.label}
                  onActivate={item.onClick}
                  href={item.href}
                  mouseX={mouseX}
                  popoverContent={item.popoverContent}
                  isPopoverOpen={activePopoverId === item.id}
                  onTogglePopover={togglePopoverHandlers[item.id]}
                  anyPopoverOpen={anyPopoverOpen}
                  shouldBounceExternal={bouncingId === item.id}
                  isMobile={isMobile}
                />
              );

              // Wrap dengan <Link> untuk prefetch + native back/forward.
              // Item dengan popover tidak dibungkus karena klik harus
              // membuka popover, bukan navigate.
              if (item.href && !item.popoverContent) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    prefetch={true}
                    data-dock-focusable="true"
                    aria-label={item.label}
                    className="flex items-end rounded-[18px] no-underline focus-visible:outline-none"
                  >
                    {dockItem}
                  </Link>
                );
              }

              return dockItem;
            })}
          </div>
        </nav>
      </m.div>
    </div>
  );
}

/**
 * GlobalDock — Dock untuk route non-OS (mis. /projects, /contact).
 * Pada route OS desktop (`/`) komponen ini disembunyikan; OSDock yang aktif.
 */
export function GlobalDock({ dockConfig }: { dockConfig?: DockPreferences }) {
  const pathname = usePathname();
  const { isWindowOpen, bouncingDocId } = useWindowContext();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 768);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  // Stable handler: markBack untuk view transition arah, navigasi sendiri
  // ditangani oleh <Link> di dalam Dock. Tidak ada router.push manual lagi.
  const markNav = useCallback(() => {
    markBack();
  }, []);

  // Pisahkan struktur item statis dari status `isOpen` agar reference stabil
  // (lihat fix #9): defaultItems hanya bergantung pada handler stable; status
  // `isOpen` di-merge belakangan tanpa membuat icon node baru.
  const baseItems = useMemo<DockItemData[]>(() => {
    const items: DockItemData[] = [
      {
        id: 'projects',
        label: 'Projects',
        icon: <AppIcon icon={Grid} color="from-zinc-700 to-zinc-900" />,
        onClick: () => {},
        popoverContent: <DockProjectModes />,
      },
      {
        id: 'about',
        label: 'About Me',
        icon: <AppIcon icon={User} color="from-gray-300 to-gray-400" />,
        onClick: markNav,
        href: '/?app=about',
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: <WhatsAppIcon />,
        onClick: markNav,
        href: '/?app=whatsapp',
      },
      {
        id: 'contact',
        label: 'Contact',
        icon: <AppIcon icon={Mail} color="from-blue-400 to-indigo-500" />,
        onClick: markNav,
        href: '/?app=contact',
      },
      {
        id: 'notes',
        label: 'Notes',
        icon: <AppIcon icon={FileText} color="from-yellow-300 to-orange-400" />,
        onClick: markNav,
        href: '/?app=notes',
      },
      {
        id: 'trash',
        label: 'Trash',
        icon: <AppIcon icon={Trash2} color="from-gray-400 to-gray-500" />,
        onClick: markNav,
        href: '/?app=trash-bin',
      },
    ];
    return getDockItemConfig(items, dockConfig);
  }, [markNav, dockConfig]);

  // Status `isOpen` di-merge tanpa membuat ulang icon/popoverContent —
  // mencegah re-create React elements setiap mutasi window state.
  const dockItems = useMemo<DockItemData[]>(() => {
    return baseItems.map((item) => {
      switch (item.id) {
        case 'about':
          return { ...item, isOpen: isWindowOpen('about') };
        case 'whatsapp':
          return { ...item, isOpen: isWindowOpen('whatsapp') };
        case 'notes':
          return { ...item, isOpen: isWindowOpen('notes') };
        case 'trash':
          return { ...item, isOpen: isWindowOpen('trash-bin') };
        default:
          return item;
      }
    });
  }, [baseItems, isWindowOpen]);

  // SSR-safe: pathname null saat server. Sembunyikan di route OS desktop
  // dan admin. (`/about` dropped — route tidak ada lagi.)
  if (!pathname || pathname === '/' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div
      className="pb-safe pointer-events-none fixed bottom-4 left-0 right-0 flex justify-center"
      style={{
        zIndex: 99999,
        viewTransitionName: 'global-dock',
      }}
    >
      <div className="pointer-events-auto">
        <Dock items={dockItems} bouncingId={bouncingDocId} isMobile={isMobile} />
      </div>
    </div>
  );
}

/**
 * OSDock — Dock untuk route OS desktop (`/`).
 *
 * Item DI SINI tidak memakai `href`: klik membuka window via state context
 * yang di-pass dari parent (UIOverlaysLayer), bukan navigasi route.
 * Mencegah double-action yang sebelumnya muncul saat anchor `<Link>` ikut
 * push URL ke `/?app=...` setelah window sudah dibuka oleh `onClick`.
 */
export interface OSDockProps {
  aboutData?: AboutData;
  onOpenWindow: (windowId: string) => void;
  onOpenWhatsApp: () => void;
  onOpenContact: () => void;
  onOpenNotes: () => void;
  onOpenTrash: () => void;
  isWindowOpen: (windowId: string) => boolean;
  notesVisible: boolean;
  bouncingId?: string | null;
  className?: string;
  isMobile?: boolean;
}

export function OSDock({
  aboutData,
  onOpenWindow,
  onOpenWhatsApp,
  onOpenContact,
  onOpenNotes,
  onOpenTrash,
  isWindowOpen,
  notesVisible,
  bouncingId,
  className,
  isMobile = false,
}: OSDockProps) {
  const router = useTransitionRouter();

  // Stable handler — projects adalah satu-satunya item OS yang menavigasi
  // ke route lain. Pakai useTransitionRouter agar view-transition arah
  // tetap kena snapshot. markForward() sebelum push memastikan slide
  // direction default (kanan-ke-kiri) tidak ter-warisi dari `data-vt-direction='back'`
  // yang mungkin tertinggal dari klik back button sebelumnya.
  const handleOpenProjects = useCallback(() => {
    // Reset direction ke forward eksplisit — kalau atribut `back` masih
    // melekat dari interaksi sebelumnya (mis. back button view), animasi
    // slide akan terbalik (slide ke kanan, terlihat "tidak ada efek"
    // karena halaman lama masih kelihatan saat halaman baru masuk dari kiri).
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-vt-direction');
    }
    router.push('/projects');
  }, [router]);

  // Pisahkan struktur item dari status `isOpen`: icon nodes hanya dibuat
  // sekali, lalu status `isOpen` di-merge tanpa rebuild elements.
  const baseItems = useMemo<DockItemData[]>(() => {
    const items: DockItemData[] = [
      {
        id: 'projects',
        label: 'Projects',
        icon: <AppIcon icon={Grid} color="from-zinc-700 to-zinc-900" />,
        onClick: handleOpenProjects,
        popoverContent: <DockProjectModes />,
      },
      {
        id: 'about',
        label: 'About Me',
        icon: <AppIcon icon={User} color="from-gray-300 to-gray-400" />,
        onClick: () => onOpenWindow('about'),
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: <WhatsAppIcon />,
        onClick: onOpenWhatsApp,
      },
      {
        id: 'contact',
        label: 'Contact',
        icon: <AppIcon icon={Mail} color="from-blue-400 to-indigo-500" />,
        onClick: onOpenContact,
      },
      {
        id: 'notes',
        label: 'Notes',
        icon: <AppIcon icon={FileText} color="from-yellow-300 to-orange-400" />,
        onClick: onOpenNotes,
      },
      {
        id: 'trash',
        label: 'Trash',
        icon: <AppIcon icon={Trash2} color="from-gray-400 to-gray-500" />,
        onClick: onOpenTrash,
      },
    ];
    return getDockItemConfig(items, aboutData?.dockConfig);
  }, [
    aboutData?.dockConfig,
    handleOpenProjects,
    onOpenWindow,
    onOpenWhatsApp,
    onOpenContact,
    onOpenNotes,
    onOpenTrash,
  ]);

  const dockItems = useMemo<DockItemData[]>(() => {
    return baseItems.map((item) => {
      switch (item.id) {
        case 'about':
          return { ...item, isOpen: isWindowOpen('about') };
        case 'whatsapp':
          return { ...item, isOpen: isWindowOpen('whatsapp') };
        case 'contact':
          return { ...item, isOpen: isWindowOpen('contact') };
        case 'notes':
          return { ...item, isOpen: notesVisible };
        case 'trash':
          return { ...item, isOpen: isWindowOpen('trash-bin') };
        default:
          return item;
      }
    });
  }, [baseItems, isWindowOpen, notesVisible]);

  return (
    <div className={className}>
      <Dock items={dockItems} bouncingId={bouncingId} isMobile={isMobile} />
    </div>
  );
}
