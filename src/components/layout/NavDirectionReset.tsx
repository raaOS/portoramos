'use client';

import { useEffect } from 'react';
import { markBack, markForward } from '@/lib/navigationDirection';

/**
 * Pasang default arah "forward" sebelum setiap klik link.
 *
 * Kenapa via capture-phase listener (bukan pathname useEffect):
 * - View Transitions snapshot DOM pada saat click → reset harus terjadi
 *   SEBELUM snapshot, bukan setelah halaman baru mount.
 * - Capture phase jalan sebelum React synthetic events.
 *
 * Performance optimasi:
 * - Listener di-scope ke <body>, bukan document, untuk kurangi bubbling cost.
 * - passive:true agar nggak block main thread.
 * - Early-exit untuk modifier keys (Ctrl/Cmd/Shift click → buka tab baru).
 */
export default function NavDirectionReset() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handler = (e: MouseEvent) => {
      // Skip klik yang bukan navigasi (modifier = open in new tab)
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Cari anchor terdekat — kalau bukan link, skip (90%+ klik di desktop OS)
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;

      // Opt-in eksplisit via data-vt-back attribute (alternatif ke onClickCapture)
      if (anchor.dataset.vtBack !== undefined) {
        markBack();
        return;
      }

      // Default forward. React onClickCapture akan override kalau ini back button.
      markForward();
    };

    // Attach ke body bukan document — kurangi event bubbling scope,
    // dan passive listener supaya tidak block scrolling/rendering.
    const root = document.body;
    root.addEventListener('click', handler, { capture: true, passive: true });

    return () => {
      root.removeEventListener('click', handler, { capture: true });
    };
  }, []);

  return null;
}
