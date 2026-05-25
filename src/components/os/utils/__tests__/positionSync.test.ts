import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPositions,
  savePositions,
  saveWindowPosition,
  saveIconPosition,
  saveNotePosition,
  getWindowPosition,
  getIconPosition,
} from '../positionSync';

/**
 * Stub window.innerWidth/innerHeight untuk deterministic tests.
 * Harus dipanggil sebelum panggil fungsi yang baca viewport.
 */
function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });
}

describe('positionSync', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Default viewport yang cukup luas supaya sebagian besar test case nggak
    // kena clamp kecuali memang di-test khusus.
    setViewport(1920, 1080);
  });

  describe('saveWindowPosition', () => {
    it('does nothing for non-admin users', () => {
      saveWindowPosition('win-1', { x: 50, y: 60 }, false);
      expect(loadPositions().windows).toBeUndefined();
    });

    it('saves full position for admin', () => {
      saveWindowPosition('win-1', { x: 50, y: 60, width: 800, height: 500 }, true);

      const stored = loadPositions().windows?.['win-1'];
      expect(stored).toEqual({ x: 50, y: 60, width: 800, height: 500 });
    });

    it('preserves existing width/height saat partial update (drag only)', () => {
      saveWindowPosition('win-drag', { x: 10, y: 20, width: 1200, height: 800 }, true);
      saveWindowPosition('win-drag', { x: 100, y: 200 }, true);

      const stored = loadPositions().windows?.['win-drag'];
      expect(stored).toEqual({
        x: 100,
        y: 200,
        width: 1200,
        height: 800,
      });
    });

    it('preserves existing x/y saat hanya resize (width/height update)', () => {
      saveWindowPosition('win-resize', { x: 300, y: 400, width: 600, height: 500 }, true);
      saveWindowPosition('win-resize', { width: 900, height: 700 }, true);

      const stored = loadPositions().windows?.['win-resize'];
      expect(stored).toEqual({
        x: 300,
        y: 400,
        width: 900,
        height: 700,
      });
    });

    it('menggunakan default fallback kalau window belum pernah di-save', () => {
      saveWindowPosition('win-new', { x: 500 }, true);

      const stored = loadPositions().windows?.['win-new'];
      expect(stored).toEqual({ x: 500, y: 80, width: 900, height: 600 });
    });
  });

  describe('saveIconPosition', () => {
    it('does nothing for non-admin', () => {
      saveIconPosition('icon-1', { x: 10, y: 20 }, false);
      expect(loadPositions().icons).toBeUndefined();
    });

    it('saves pixel + percentage + ref screen for admin (responsive payload)', () => {
      setViewport(1920, 1080);
      saveIconPosition('icon-1', { x: 192, y: 108 }, true);

      const stored = loadPositions().icons?.['icon-1'];
      expect(stored).toMatchObject({
        x: 192,
        y: 108,
        xPct: 10, // 192 / 1920 * 100
        yPct: 10, // 108 / 1080 * 100
        refScreenWidth: 1920,
        refScreenHeight: 1080,
      });
    });

    it('merges when saving multiple icons', () => {
      saveIconPosition('icon-a', { x: 1, y: 1 }, true);
      saveIconPosition('icon-b', { x: 2, y: 2 }, true);

      const icons = loadPositions().icons;
      expect(icons?.['icon-a']?.x).toBe(1);
      expect(icons?.['icon-b']?.x).toBe(2);
    });
  });

  describe('saveNotePosition', () => {
    it('does nothing for non-admin (visitor refresh = reset)', () => {
      saveNotePosition('note-1', { x: 10, y: 20 }, false);
      expect(loadPositions().notes).toBeUndefined();
    });

    it('preserves width/height saat admin hanya geser', () => {
      saveNotePosition('note-a', { x: 50, y: 50, width: 400, height: 400 }, true);
      saveNotePosition('note-a', { x: 150, y: 250 }, true);

      const stored = loadPositions().notes?.['note-a'];
      expect(stored).toEqual({
        x: 150,
        y: 250,
        width: 400,
        height: 400,
      });
    });
  });

  describe('savePositions (bulk)', () => {
    it('deep-merges windows/icons/notes across multiple calls', () => {
      savePositions({ windows: { a: { x: 1, y: 1, width: 100, height: 100 } } });
      savePositions({ icons: { i: { x: 2, y: 2 } } });

      const loaded = loadPositions();
      expect(loaded.windows?.a).toBeDefined();
      expect(loaded.icons?.i).toBeDefined();
    });
  });

  describe('getWindowPosition with responsive positioning', () => {
    it('menggunakan percentage-based jika tersedia', () => {
      setViewport(1000, 800);

      const result = getWindowPosition(
        'win-pct',
        {
          xPct: 10,
          yPct: 20,
          widthPct: 50,
          heightPct: 40,
        },
        { x: 0, y: 0, width: 800, height: 600 },
        false
      );

      expect(result.x).toBeCloseTo(100);
      expect(result.y).toBeCloseTo(160);
      expect(result.width).toBeCloseTo(500);
      expect(result.height).toBeCloseTo(320);
    });

    it('falls back ke defaults kalau CLOUDFLARE_D1 data kosong', () => {
      const defaults = { x: 100, y: 80, width: 900, height: 600 };
      const result = getWindowPosition('win-empty', null, defaults, false);
      expect(result).toEqual(defaults);
    });
  });

  describe('getIconPosition (responsive)', () => {
    it('menggunakan percentage-based untuk visitor saat tersedia', () => {
      setViewport(1366, 768);

      const result = getIconPosition(
        'icon-pct',
        { xPct: 50, yPct: 10, x: 0, y: 0 }, // pakai % 50/10 (center-ish)
        { x: 0, y: 0 },
        false
      );

      // 50% * 1366 = 683, 10% * 768 = 76.8
      expect(result.x).toBeCloseTo(683);
      expect(result.y).toBeCloseTo(76.8);
    });

    it('scale legacy pixel via refScreen saat visitor di layar beda', () => {
      setViewport(1366, 768);

      const result = getIconPosition(
        'icon-legacy',
        {
          x: 1800,
          y: 900, // pixel at admin 1920x1080
          refScreenWidth: 1920,
          refScreenHeight: 1080,
        },
        { x: 0, y: 0 },
        false
      );

      // 1800/1920 * 1366 ≈ 1280.6  → below clamp max (1366 - 80 - 8 = 1278)
      // 900/1080 * 768 = 640       → below clamp max (768 - 120 = 648)
      expect(result.x).toBeLessThanOrEqual(1278);
      expect(result.y).toBeLessThanOrEqual(648);
      expect(result.x).toBeGreaterThan(1200);
      expect(result.y).toBeGreaterThan(600);
    });

    it('clamp icon yang disave admin keluar viewport visitor', () => {
      setViewport(800, 600);

      // Admin saved icon at x=1800 (di luar 800x600 visitor)
      const result = getIconPosition(
        'icon-overflow',
        { xPct: 95, yPct: 95, x: 0, y: 0 }, // 95% di viewport visitor = 760, 570
        { x: 0, y: 0 },
        false
      );

      // Max bound: 800 - 80 - 8 = 712 (ICON_BOX=80, SIDE_SAFE=8)
      expect(result.x).toBeLessThanOrEqual(712);
      // Max y: 600 - 120 = 480 (BOTTOM_SAFE=120)
      expect(result.y).toBeLessThanOrEqual(480);
    });

    it('pakai localStorage untuk admin (tapi tetap clamp)', () => {
      setViewport(800, 600);
      // Admin save besar dulu, lalu di-load di viewport kecil
      saveIconPosition('icon-admin', { x: 400, y: 300 }, true);

      const result = getIconPosition('icon-admin', { x: 100, y: 100 }, { x: 0, y: 0 }, true);

      // 400, 300 masih dalam viewport 800x600 → tetap
      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });

    it('visitor: abaikan localStorage (CLOUDFLARE_D1 = source of truth)', () => {
      setViewport(1920, 1080);
      savePositions({
        icons: {
          'icon-v': { x: 999, y: 999, xPct: 50, yPct: 50 },
        },
      });

      const result = getIconPosition('icon-v', { x: 200, y: 200 }, { x: 0, y: 0 }, false);

      // Visitor lookup pakai CLOUDFLARE_D1Data parameter (bukan localStorage).
      // CLOUDFLARE_D1Data = {x:200,y:200} (legacy pixel, no pct).
      expect(result.x).toBe(200);
      expect(result.y).toBe(200);
    });

    it('falls back ke defaults kalau CLOUDFLARE_D1 kosong', () => {
      setViewport(1920, 1080);
      const result = getIconPosition('icon-none', null, { x: 50, y: 60 }, false);
      expect(result).toEqual({ x: 50, y: 60 });
    });
  });
});
