'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useOSOverlays } from '../context/OSSystemContext';
import { Z_LAYERS } from '../utils/zIndexLayers';
import { useReducedMotion } from 'motion/react';
import { useTransitionRouter } from 'next-view-transitions';
import type { LottieRefCurrentProps } from 'lottie-react';
import IOSPinModal from '@/components/shared/IOSPinModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { MenuBarViewMenu } from './menu-bar/MenuBarViewMenu';
import { MenuBarAdminBadge } from './menu-bar/MenuBarAdminBadge';
import { MenuBarStatusItems } from './menu-bar/MenuBarStatusItems';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Lazy-load Lottie animation data via fetch from public URL to reduce initial bundle size (11.9 KB).
// Static import from `public/lottie/mata.json` was synchronous and inflated the main chunk.
let cachedLogoAnimationData: Record<string, unknown> | null = null;
const loadLogoAnimationData = () =>
  fetch('/lottie/mata.json')
    .then((r) => r.json())
    .then((data) => {
      cachedLogoAnimationData = data;
      return data;
    });

interface MenuBarProps {
  onSearch?: () => void;
  activeWindow?: string;
  onAbout?: () => void;
  availability?: {
    status: string;
    text: string;
  };
  isAdmin?: boolean;
  onLogout?: () => void;
  onToggleControlCenter?: () => void;
}

export default function MenuBar({
  onSearch,
  activeWindow = 'Finder',
  onAbout,
  availability,
  isAdmin,
  onLogout,
  onToggleControlCenter,
}: MenuBarProps) {
  const { showCalendar, setShowCalendar } = useOSOverlays();
  const { dictionary: t, meta } = useLanguage();
  const [time, setTime] = useState(new Date());
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [logoAnimationData, setLogoAnimationData] = useState<Record<string, unknown> | null>(
    () => cachedLogoAnimationData
  );
  const router = useTransitionRouter();

  const prefersReducedMotion = useReducedMotion();
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  // Lazy-load Lottie animation data after mount
  useEffect(() => {
    if (cachedLogoAnimationData) return;
    loadLogoAnimationData().then(setLogoAnimationData);
  }, []);

  useEffect(() => {
    const instance = lottieRef.current;
    return () => {
      instance?.destroy?.();
    };
  }, []);

  useEffect(() => {
    const updateClock = () => setTime(new Date());
    updateClock();

    const scheduleNextTick = () => {
      const now = new Date();
      const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      return window.setTimeout(
        () => {
          updateClock();
          timer = scheduleNextTick();
        },
        Math.max(delay, 250)
      );
    };

    let timer = scheduleNextTick();
    return () => window.clearTimeout(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString(meta.intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString(meta.intlLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const localizedActiveWindow =
    activeWindow === 'Finder'
      ? t.windowTitles.finder
      : activeWindow === 'Finder: About Me'
        ? t.windowTitles.about
        : activeWindow === 'WhatsApp'
          ? t.windowTitles.whatsapp
          : activeWindow === 'Contact'
            ? t.windowTitles.contact
            : activeWindow === 'Finder: Projects'
              ? t.windowTitles.projects
              : activeWindow === 'Project Explorer'
                ? t.windowTitles.explorer
                : activeWindow === 'Recycle Bin'
                  ? t.windowTitles.trash
                  : activeWindow;

  const availabilityText =
    availability?.status === 'available'
      ? t.header.available
      : availability?.status === 'busy'
        ? t.header.busy
        : availability?.text;

  return (
    <div
      className="pointer-events-auto fixed left-0 right-0 top-0 flex h-9 select-none touch-manipulation items-center justify-between gap-2 border-b border-gray-200 bg-white px-2 text-xs text-black sm:h-8 sm:px-3 lg:px-4 print:hidden"
      style={{ zIndex: Z_LAYERS.CHROME }}
    >
      {/* Left Side */}
      <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2 lg:gap-4">
        <div
          onClick={() => setIsPinModalOpen(true)}
          className="relative flex h-8 w-12 shrink-0 cursor-pointer touch-manipulation items-center justify-center"
          aria-label={t.menuBar.ramosOS}
          role="img"
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {logoAnimationData && (
              <Lottie
                lottieRef={lottieRef}
                animationData={logoAnimationData}
                loop={!prefersReducedMotion}
                autoplay={!prefersReducedMotion}
                rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
                style={{ width: 96, height: 96 }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
        <div
          className="hidden max-w-[clamp(5rem,22vw,12rem)] cursor-pointer truncate whitespace-nowrap rounded px-2 py-1 font-bold transition-colors hover:bg-black/5 sm:block"
          onClick={onAbout}
          title={localizedActiveWindow}
        >
          {localizedActiveWindow}
        </div>

        {/* Menus */}
        <div className="hidden items-center gap-1 font-medium lg:flex">
          <div className="cursor-default rounded px-2 py-1 transition-colors hover:bg-black/5 xl:px-3">
            {t.menuBar.file}
          </div>
          <div className="cursor-default rounded px-2 py-1 transition-colors hover:bg-black/5 xl:px-3">
            {t.menuBar.edit}
          </div>
          <MenuBarViewMenu
            viewLabel={t.menuBar.view}
            showGhostCursorsLabel={t.menuBar.showGhostCursors}
          />
          <div className="cursor-default rounded px-2 py-1 transition-colors hover:bg-black/5 xl:px-3">
            {t.menuBar.go}
          </div>
          <div className="cursor-default rounded px-2 py-1 transition-colors hover:bg-black/5 xl:px-3">
            {t.menuBar.window}
          </div>
          <div className="cursor-default rounded px-2 py-1 transition-colors hover:bg-black/5 xl:px-3">
            {t.menuBar.help}
          </div>
        </div>
      </div>

      {/* Center Area - Admin Mode Badge */}
      <MenuBarAdminBadge
        isAdmin={isAdmin}
        adminModeLabel={t.menuBar.adminMode}
        exitAdminLabel={t.menuBar.exitAdmin}
        onLogout={onLogout}
      />

      {/* Right Side */}
      <MenuBarStatusItems
        availability={availability}
        availabilityText={availabilityText}
        batteryFullLabel={t.menuBar.batteryFull}
        formattedDate={formattedDate}
        formattedTime={formattedTime}
        showCalendar={showCalendar}
        onSearch={onSearch}
        onToggleControlCenter={onToggleControlCenter}
        onToggleCalendar={() => setShowCalendar(!showCalendar)}
      />

      <IOSPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => router.push('/admin/login?redirect=%2Fadmin')}
      />
    </div>
  );
}
