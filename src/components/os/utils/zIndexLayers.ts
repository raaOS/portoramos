/**
 * Centralized z-index tokens untuk OS desktop environment.
 *
 * Angka di sini sengaja dibiarkan sama dengan nilai hardcoded sebelumnya
 * supaya stacking order tidak berubah saat migrasi. Prinsip:
 *
 *  - Runtime-managed (windows, sticky notes, dynamic island) tetap pakai
 *    `UnifiedZIndexContext` (range 100..~900000).
 *  - Overlay persisten (menu bar, dock, popouts, boot screen, modals) pakai
 *    token statis di bawah ini supaya mudah di-audit dan tidak saling
 *    menyusup.
 *
 * Hierarchy (bottom → top):
 *
 *   DESKTOP_BASE        0           wallpaper, icons layer
 *   WINDOW_RUNTIME      100..~9k    di-manage UnifiedZIndexContext
 *   BACKDROP            9_999       dimmer untuk spotlight / overlay
 *   CHROME              10_000      menu bar, top-of-desktop overlays
 *   POPOUT              10_001      control center, calendar wrapper
 *   POPOUT_CONTENT      10_002      spotlight panel, calendar popout, boot reveal layer
 *   DOCK                99_999      OS dock + dock hover capture
 *   DOCK_POPOVER        100_000     context menu di atas dock
 *   BOOT                999_999     start screen & skeleton saat booting
 *   CRITICAL_MODAL      1_000_000   password modal (di atas semua)
 */
export const Z_LAYERS = {
  DESKTOP_BASE: 0,
  BACKDROP: 9_999,
  CHROME: 10_000,
  POPOUT: 10_001,
  POPOUT_CONTENT: 10_002,
  DOCK: 99_999,
  DOCK_POPOVER: 100_000,
  BOOT: 999_999,
  CRITICAL_MODAL: 1_000_000,
} as const;

export type ZLayer = keyof typeof Z_LAYERS;

/**
 * Default wallpaper lokal — dipakai saat CLOUDFLARE_D1 wallpaper config belum
 * tersedia atau URL tidak valid. Menghindari dependency ke images.unsplash.com
 * untuk LCP path halaman utama.
 */
export const DEFAULT_WALLPAPER_URL = '/wallpapers/optimized-wallpaper.webp';
