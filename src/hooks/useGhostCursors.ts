import { useState, useEffect } from 'react';

export interface GhostCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

/** Default cursor definitions — dapat di-override via options. */
const DEFAULT_CURSORS: Omit<GhostCursor, 'x' | 'y'>[] = [
  { id: '1', name: 'Sarah (Designer)', color: '#ec4899' },
  { id: '2', name: 'Guest 412', color: '#f97316' },
  { id: '3', name: 'Rian (Developer)', color: '#06b6d4' },
];

export interface GhostCursorOptions {
  /** Template cursor (default: 3 preset cursors). */
  cursors?: Omit<GhostCursor, 'x' | 'y'>[];
  /** Interval pergerakan cursor dalam ms (default: 2000-3000, diacak). */
  moveIntervalMs?: number;
  /** Jarak pergerakan per tick dalam px (default: 250). */
  moveRange?: number;
  /** Padding dari tepi viewport dalam px (default: 50). */
  edgePadding?: number;
}

/**
 * Hook untuk menghasilkan ghost cursors dekoratif yang bergerak acak.
 *
 * @param enabled - Apakah ghost cursors aktif
 * @param options - Konfigurasi opsional (cursors, interval, range, padding)
 *
 * @example
 * ```tsx
 * const cursors = useGhostCursors(true);
 * const cursors = useGhostCursors(true, { cursors: [{ id: '1', name: 'Bot', color: '#f00' }] });
 * ```
 */
export function useGhostCursors(enabled: boolean, options?: GhostCursorOptions): GhostCursor[] {
  const [cursors, setCursors] = useState<GhostCursor[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const cursorTemplates = options?.cursors ?? DEFAULT_CURSORS;
    const moveRange = options?.moveRange ?? 250;
    const padding = options?.edgePadding ?? 50;

    // Initialize random positions asynchronously to satisfy ESLint set-state-in-effect rule
    const timer = setTimeout(() => {
      setCursors(
        cursorTemplates.map((template) => ({
          ...template,
          x: Math.random() * 600 + 100,
          y: Math.random() * 400 + 100,
        }))
      );
    }, 0);

    const interval = setInterval(
      () => {
        setCursors((prev) =>
          prev.map((c) => {
            const dx = (Math.random() - 0.5) * moveRange * 2;
            const dy = (Math.random() - 0.5) * moveRange * 2;

            const limitWidth = typeof window !== 'undefined' ? window.innerWidth - 150 : 800;
            const limitHeight = typeof window !== 'undefined' ? window.innerHeight - 150 : 600;

            return {
              ...c,
              x: Math.max(padding, Math.min(limitWidth, c.x + dx)),
              y: Math.max(padding, Math.min(limitHeight, c.y + dy)),
            };
          })
        );
      },
      options?.moveIntervalMs ?? 2000 + Math.random() * 1000
    );

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      setCursors([]);
    };
  }, [enabled, options]);

  return enabled ? cursors : [];
}
