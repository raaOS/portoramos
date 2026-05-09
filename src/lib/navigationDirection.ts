/**
 * Helper untuk set arah slide animation berdasarkan konteks navigasi.
 *
 * Pola:
 * - Forward (masuk lebih dalam, misal /projects → /projects/slug) → slide dari kanan (default)
 * - Back (kembali ke halaman sebelumnya) → slide dari kiri
 *
 * Direction di-set sebagai attribute `data-vt-direction` pada <html>.
 * CSS di src/app/globals.css baca attribute ini untuk pilih keyframe arah.
 *
 * Catatan:
 * - Set SEBELUM trigger navigasi (onClick, router.push) agar kena snapshot
 *   View Transitions API.
 * - Untuk navigasi forward, panggil `markForward()` untuk hapus attribute
 *   dari navigasi back sebelumnya (default CSS = forward).
 */

export type NavDirection = 'forward' | 'back';

const DIR_ATTR = 'data-vt-direction';

export function markBack(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(DIR_ATTR, 'back');
}

export function markForward(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.removeAttribute(DIR_ATTR);
}

export function setNavDirection(direction: NavDirection): void {
  if (direction === 'back') {
    markBack();
  } else {
    markForward();
  }
}
