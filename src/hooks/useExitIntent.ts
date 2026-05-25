'use client';

import { useEffect, useRef, useState } from 'react';

interface UseExitIntentOptions {
  /** Disable hook entirely (mis. saat di-skip via session flag) */
  enabled?: boolean;
  /** Minimum waktu user harus di halaman sebelum trigger aktif (ms). Default: 15 detik */
  minEngagementMs?: number;
  /** Delay start sebelum listener attached (ms). Default: sama dengan minEngagementMs */
  startDelayMs?: number;
  /** Batas atas pixel Y dari mouse untuk trigger. Default: 50 */
  triggerThresholdPx?: number;
}

/**
 * Deteksi "exit intent" di desktop: kursor bergerak cepat ke arah tombol
 * close tab / URL bar (pointer meninggalkan viewport ke atas).
 *
 * Behavior:
 * - Hanya aktif di desktop (mobile tidak punya konsep kursor keluar viewport).
 * - Baru listen setelah user engaged cukup lama (default 15 detik) biar
 *   trigger-nya kena ke visitor yang beneran "mau pergi" bukan yang baru nyampe.
 * - Fires sekali per mount — caller wajib handle sendiri persistensi
 *   (sessionStorage/localStorage) kalau mau throttle across navigations.
 */
export function useExitIntent({
  enabled = true,
  minEngagementMs = 15_000,
  startDelayMs,
  triggerThresholdPx = 50,
}: UseExitIntentOptions = {}): boolean {
  const [triggered, setTriggered] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    // Skip di mobile/tablet — exit-intent via mouse tidak ada
    const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
    if (isCoarsePointer) return;

    const delay = typeof startDelayMs === 'number' ? startDelayMs : minEngagementMs;
    let active = false;
    let armTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMouseOut = (e: MouseEvent) => {
      if (!active || firedRef.current) return;
      // relatedTarget null + mouse dekat top = kursor meninggalkan viewport ke atas
      if (!e.relatedTarget && e.clientY <= triggerThresholdPx) {
        firedRef.current = true;
        setTriggered(true);
      }
    };

    armTimer = setTimeout(() => {
      active = true;
      document.addEventListener('mouseout', handleMouseOut);
    }, delay);

    return () => {
      if (armTimer) clearTimeout(armTimer);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [enabled, minEngagementMs, startDelayMs, triggerThresholdPx]);

  return triggered;
}
