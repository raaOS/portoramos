'use client';

import React, { useEffect, useMemo, useState } from 'react';
import DesktopSkeleton from '@/components/os/ui/DesktopSkeleton';
import type { DesktopEnvironmentProps } from '@/components/os/core/DesktopEnvironment';

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
 */
// Module-level cache for the dynamically imported DesktopOS component.
// Resolves synchronously on returning to the home page, preventing 1-frame skeleton glitches.
let cachedDesktopOS: DesktopComponent | null = null;

export default function HomeOSWrapper(props: DesktopEnvironmentProps) {
  const wallpaperUrl = useMemo(() => {
    const cfg = props.aboutData?.wallpaperConfig;
    if (!cfg?.activeWallpaperId) return undefined;
    return cfg.collection?.find((w) => w.id === cfg.activeWallpaperId)?.url;
  }, [props.aboutData]);

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

  if (!DesktopOS) {
    return <DesktopSkeleton wallpaperUrl={wallpaperUrl} />;
  }

  return <DesktopOS {...props} />;
}
