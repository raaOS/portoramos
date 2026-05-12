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

describe('positionSync', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    describe('saveWindowPosition', () => {
        it('does nothing for non-admin users', () => {
            saveWindowPosition('win-1', { x: 50, y: 60 }, false);
            expect(loadPositions().windows).toBeUndefined();
        });

        it('saves full position for admin', () => {
            saveWindowPosition(
                'win-1',
                { x: 50, y: 60, width: 800, height: 500 },
                true
            );

            const stored = loadPositions().windows?.['win-1'];
            expect(stored).toEqual({ x: 50, y: 60, width: 800, height: 500 });
        });

        it('preserves existing width/height saat partial update (drag only)', () => {
            // REGRESSION: Sebelum fix, partial update dengan hanya x/y me-reset
            // width/height ke default 900x600 (hardcoded fallback).
            saveWindowPosition(
                'win-drag',
                { x: 10, y: 20, width: 1200, height: 800 },
                true
            );

            // Drag: hanya update x/y
            saveWindowPosition('win-drag', { x: 100, y: 200 }, true);

            const stored = loadPositions().windows?.['win-drag'];
            expect(stored).toEqual({
                x: 100,
                y: 200,
                width: 1200, // preserved, BUKAN 900
                height: 800, // preserved, BUKAN 600
            });
        });

        it('preserves existing x/y saat hanya resize (width/height update)', () => {
            saveWindowPosition(
                'win-resize',
                { x: 300, y: 400, width: 600, height: 500 },
                true
            );

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
            // Default fallback: { x: 100, y: 80, width: 900, height: 600 }
            expect(stored).toEqual({ x: 500, y: 80, width: 900, height: 600 });
        });
    });

    describe('saveIconPosition', () => {
        it('does nothing for non-admin', () => {
            saveIconPosition('icon-1', { x: 10, y: 20 }, false);
            expect(loadPositions().icons).toBeUndefined();
        });

        it('saves for admin', () => {
            saveIconPosition('icon-1', { x: 10, y: 20 }, true);
            expect(loadPositions().icons?.['icon-1']).toEqual({ x: 10, y: 20 });
        });

        it('merges when saving multiple icons', () => {
            saveIconPosition('icon-a', { x: 1, y: 1 }, true);
            saveIconPosition('icon-b', { x: 2, y: 2 }, true);

            const icons = loadPositions().icons;
            expect(icons?.['icon-a']).toEqual({ x: 1, y: 1 });
            expect(icons?.['icon-b']).toEqual({ x: 2, y: 2 });
        });
    });

    describe('saveNotePosition', () => {
        it('does nothing for non-admin (visitor refresh = reset)', () => {
            saveNotePosition('note-1', { x: 10, y: 20 }, false);
            expect(loadPositions().notes).toBeUndefined();
        });

        it('preserves width/height saat admin hanya geser', () => {
            saveNotePosition(
                'note-a',
                { x: 50, y: 50, width: 400, height: 400 },
                true
            );
            saveNotePosition('note-a', { x: 150, y: 250 }, true);

            const stored = loadPositions().notes?.['note-a'];
            expect(stored).toEqual({
                x: 150,
                y: 250,
                width: 400, // preserved
                height: 400, // preserved
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
            const viewport = { width: 1000, height: 800 };
            // Stub innerWidth/innerHeight
            Object.defineProperty(window, 'innerWidth', {
                value: viewport.width,
                configurable: true,
            });
            Object.defineProperty(window, 'innerHeight', {
                value: viewport.height,
                configurable: true,
            });

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

            expect(result.x).toBeCloseTo(100); // 10% * 1000
            expect(result.y).toBeCloseTo(160); // 20% * 800
            expect(result.width).toBeCloseTo(500); // 50% * 1000
            expect(result.height).toBeCloseTo(320); // 40% * 800
        });

        it('falls back ke defaults kalau Firebase data kosong', () => {
            const defaults = { x: 100, y: 80, width: 900, height: 600 };
            const result = getWindowPosition('win-empty', null, defaults, false);
            expect(result).toEqual(defaults);
        });
    });

    describe('getIconPosition', () => {
        it('uses local storage for admin if available', () => {
            saveIconPosition('icon-admin', { x: 999, y: 999 }, true);
            const result = getIconPosition(
                'icon-admin',
                { x: 100, y: 100 },
                { x: 0, y: 0 },
                true
            );
            expect(result).toEqual({ x: 999, y: 999 });
        });

        it('ignores local storage for visitor', () => {
            // Simulate localStorage punya data (misal dari admin sebelumnya)
            savePositions({ icons: { 'icon-v': { x: 999, y: 999 } } });
            const result = getIconPosition(
                'icon-v',
                { x: 200, y: 200 },
                { x: 0, y: 0 },
                false
            );
            // Visitor: pakai firebase data, bukan localStorage
            expect(result).toEqual({ x: 200, y: 200 });
        });

        it('falls back ke defaults kalau firebase kosong', () => {
            const result = getIconPosition(
                'icon-none',
                null,
                { x: 50, y: 60 },
                false
            );
            expect(result).toEqual({ x: 50, y: 60 });
        });
    });
});
