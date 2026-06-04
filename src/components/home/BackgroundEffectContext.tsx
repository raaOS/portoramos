'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Context kecil yang di-mount di `HomeOSWrapper` (di atas DesktopOS dan
 * DesktopSkeleton). Tujuan utamanya: `DesktopBackground` bisa hidup di
 * level wrapper tanpa kehilangan kemampuan mereaksi efek blur+scale saat
 * project window terbuka.
 *
 * Kenapa lift `DesktopBackground` keluar dari DesktopMain?
 *   - `<video>` wallpaper sebelumnya di-remount dua sampai tiga kali di
 *     refresh: skeleton -> DesktopOS (chunk loaded) -> mounted flip.
 *     Setiap remount = browser fetch ulang dari awal -> visitor lihat
 *     poster JPG (atau hitam) selama beberapa detik sebelum video
 *     pertama kali bisa play.
 *   - Dengan lift, `<video>` element stable lintas semua transisi di
 *     atas. Browser cuma fetch sekali, autoplay langsung jalan begitu
 *     metadata siap.
 *
 * Setter dipanggil dari `DesktopMain` via useEffect saat `windows`
 * berubah; `DesktopBackground` membaca state untuk memutuskan apakah
 * ingin trigger animasi blur+scale.
 */
interface BackgroundEffectValue {
  isWindowOpen: boolean;
  setIsWindowOpen: (v: boolean) => void;
}

const BackgroundEffectContext = createContext<BackgroundEffectValue>({
  isWindowOpen: false,
  // No-op default supaya `DesktopBackground` aman dipakai di luar
  // provider (mis. di test / preview) tanpa crash.
  setIsWindowOpen: () => {},
});

export function BackgroundEffectProvider({ children }: { children: ReactNode }) {
  const [isWindowOpen, setOpen] = useState(false);
  const setIsWindowOpen = useCallback((v: boolean) => setOpen(v), []);
  const value = useMemo(
    () => ({ isWindowOpen, setIsWindowOpen }),
    [isWindowOpen, setIsWindowOpen]
  );
  return (
    <BackgroundEffectContext.Provider value={value}>{children}</BackgroundEffectContext.Provider>
  );
}

export function useBackgroundEffect() {
  return useContext(BackgroundEffectContext);
}
