'use client';

import { useEffect } from 'react';
import { markBack, markForward } from '@/lib/navigationDirection';

/**
 * Pasang default arah "forward" sebelum setiap klik link.
 *
 * Kenapa via global capture-phase listener:
 * - View Transitions ambil snapshot DOM pada saat click → terlambat kalau reset
 *   via pathname useEffect (animation keburu pakai attribute dari click sebelumnya).
 * - Capture phase jalan SEBELUM React onClick handler. Jadi:
 *     1. Listener ini set default "forward"
 *     2. Kalau Link pakai onClick={markBack}, React handler jalan → override jadi "back"
 *     3. Browser trigger startViewTransition → snapshot diambil dengan attribute yang benar
 *
 * Tanpa ini, klik back sekali kemudian klik forward akan salah arah karena
 * attribute masih "back" dari navigasi sebelumnya.
 */
export default function NavDirectionReset() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Hanya left click tanpa modifier (Ctrl/Cmd/Shift open di tab baru, skip)
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Cari anchor terdekat — kalau bukan link, skip
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;

      // Kalau anchor atau parent-nya ditandai eksplisit sebagai back
      // (via data-vt-back attribute), langsung set back di sini.
      // Ini backup selain React onClick handler.
      if (anchor.dataset.vtBack !== undefined) {
        markBack();
        return;
      }

      // Default: forward. React onClick (markBack) akan override setelah ini
      // kalau link tersebut adalah back button.
      markForward();
    };

    document.addEventListener('click', handler, { capture: true });
    return () => document.removeEventListener('click', handler, { capture: true });
  }, []);

  return null;
}
