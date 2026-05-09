/**
 * Helper untuk trigger navigasi dengan native View Transitions API.
 *
 * Kenapa perlu ini:
 * - useTransitionRouter dari next-view-transitions kadang tidak kena trigger
 *   untuk navigasi programmatic yang dilakukan dari dalam callback popover/menu
 *   (event timing berbeda dengan klik Link biasa).
 * - Helper ini langsung pakai document.startViewTransition kalau browser support,
 *   jadi jaminan lebih kuat.
 *
 * Browser yang belum support (Safari <18, Firefox <129, dll) akan fallback ke
 * navigasi instan via fn() langsung — tidak akan crash, cuma tidak ada animasi.
 */

type StartViewTransition = (cb: () => void | Promise<void>) => { finished: Promise<void> };

export function startViewTransition(fn: () => void | Promise<void>): void {
  if (typeof document === 'undefined') {
    void fn();
    return;
  }

  const doc = document as Document & { startViewTransition?: StartViewTransition };
  if (typeof doc.startViewTransition !== 'function') {
    // Browser tidak support — langsung jalankan tanpa animasi
    void fn();
    return;
  }

  doc.startViewTransition(() => {
    void fn();
  });
}
