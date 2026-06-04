'use client';

import React, { useEffect, useState } from 'react';
import DesktopSkeleton from '@/components/os/ui/DesktopSkeleton';
import DesktopBackground from '@/components/os/ui/DesktopBackground';
import type { DesktopEnvironmentProps } from '@/components/os/core/DesktopEnvironment';
import { BackgroundEffectProvider, useBackgroundEffect } from './BackgroundEffectContext';

type DesktopComponent = React.ComponentType<DesktopEnvironmentProps>;
const BOOT_SESSION_KEY = 'ramos_os_booted';

function shouldLoadDesktopImmediately() {
  try {
    return (
      document.documentElement.getAttribute('data-os-booted') === 'true' ||
      sessionStorage.getItem(BOOT_SESSION_KEY) === 'true'
    );
  } catch {
    return false;
  }
}

/**
 * Cold-start optimization:
 *
 * Sebelumnya komponen ini render skeleton text "LOADING RAMOS OS..." selama
 * SSR + first-pass hydration, lalu lazy-load `DesktopEnvironmentClient` di
 * pass kedua. Itu bikin LCP harus tunggu JS chunk download + parse.
 *
 * Sekarang: SSR langsung render `DesktopSkeleton` (wallpaper-first shell).
 * Wallpaper jadi LCP element yang streamed dari HTML response, jadi visitor
 * langsung lihat tampilan akhir. Heavy desktop chunk masih di-import lazy pada
 * cold boot, tetapi langsung dimuat saat tab ini sudah pernah boot supaya
 * refresh halaman utama tidak berhenti terlalu lama di skeleton.
 *
 * Important: jangan ubah jadi dynamic({ ssr: false }) tanpa loading skeleton —
 * itu malah buang manfaat SSR yang sudah dipakai untuk LCP wallpaper.
 *
 * Wallpaper stability fix:
 *   `DesktopBackground` di-render di level WRAPPER (bukan di dalam DesktopMain
 *   seperti sebelumnya). Tujuannya: element `<video>` tidak ke-remount saat
 *   transisi:
 *     1. SSR -> hydration
 *     2. Skeleton -> DesktopOS (chunk loaded)
 *     3. mounted=false -> mounted=true (di useDesktopLock)
 *   Sebelum fix, ketiga transisi di atas membuang DOM `<video>` lalu
 *   bikin baru, sehingga browser fetch ulang dari awal di tiap step.
 *   Visitor lihat poster JPG (atau layar hitam) selama beberapa detik
 *   sebelum video pertama bisa play. Sekarang `<video>` stable lintas
 *   semua transisi -> 1 kali fetch saja, autoplay langsung jalan begitu
 *   metadata siap.
 *
 *   `DesktopMain` masih perlu trigger efek blur+scale saat project window
 *   terbuka. Untuk itu kita pakai `BackgroundEffectContext`: DesktopMain
 *   panggil `setIsWindowOpen(...)` lewat hook, DesktopBackground baca
 *   `isWindowOpen` dari context.
 */
// Module-level cache for the dynamically imported DesktopOS component.
// Resolves synchronously on returning to the home page, preventing 1-frame skeleton glitches.
let cachedDesktopOS: DesktopComponent | null = null;

export default function HomeOSWrapper(props: DesktopEnvironmentProps) {
  return (
    <BackgroundEffectProvider>
      <HomeOSWrapperInner {...props} />
    </BackgroundEffectProvider>
  );
}

function HomeOSWrapperInner(props: DesktopEnvironmentProps) {
  const { isWindowOpen } = useBackgroundEffect();

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const [DesktopOS, setDesktopOS] = useState<DesktopComponent | null>(() => cachedDesktopOS);

  useEffect(() => {
    let cancelled = false;

    // Defer chunk download sampai browser idle (atau setelah hydration siap)
    // supaya tidak rebut bandwidth dengan wallpaper LCP.
    const start = () => {
      import('@/components/os/core/DesktopEnvironmentClient')
        .then((mod) => {
          cachedDesktopOS = mod.default;
          if (!cancelled) setDesktopOS(() => mod.default);
        })

        .catch((err) => {
          console.error('[HomeOSWrapper] Failed to load DesktopOS chunk:', err);
        });
    };

    if (shouldLoadDesktopImmediately()) {
      start();
      return () => {
        cancelled = true;
      };
    }

    const win = window as Window & {
      requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(start, { timeout: 1500 });
      return () => {
        cancelled = true;
        win.cancelIdleCallback?.(id);
      };
    }

    // Fallback untuk Safari (belum support requestIdleCallback)
    const tid = win.setTimeout(start, 0);
    return () => {
      cancelled = true;
      win.clearTimeout(tid);
    };
  }, []);

  return (
    <>
      {/*
       * Wallpaper layer hidup di sini supaya stable lintas transisi
       * skeleton -> DesktopOS dan mounted false -> true. Lihat header
       * komentar HomeOSWrapper untuk konteks lengkap.
       */}
      <DesktopBackground
        wallpaperConfig={props.aboutData?.wallpaperConfig}
        isMobile={isMobile}
        isWindowOpen={isWindowOpen}
      />
      {DesktopOS ? <DesktopOS {...props} /> : <DesktopSkeleton />}
    </>
  );
}
