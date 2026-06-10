'use client';

/**
 * useJellyDrag — shared "jelly drag" physics untuk Window dan DraggableStickyNote.
 *
 * Single source of truth: kedua komponen pakai hook ini supaya feel-nya
 * benar-benar identik dan tidak drift kalau salah satu dimodif.
 *
 * Pendekatan:
 * - Manual RAF loop dengan spring tension/friction (cepat dan tidak alokasi
 *   per frame sekali settled).
 * - State di-mutate in-place (lihat `resetTo()`), bukan replace object —
 *   menghindari garbage allocation di RAF tick @ 60fps.
 * - Output ke CSS variables `--jw-skew`, `--jw-sx`, `--jw-sy` lalu di-compose
 *   via Framer `transformTemplate` (TIDAK ditambah ke `generated` — append
 *   di sana akan dikalikan dengan transform lain dari `animate` prop).
 *   Lihat `composeJellyTransform` di bawah.
 * - Idle detector: kalau pointer berhenti tapi belum lepas, target dikembalikan
 *   ke rest supaya note tidak terus deformed.
 * - Reduced-motion: skip spring loop, snap langsung ke rest.
 * - Defensive cleanup: unmount membersihkan RAF + interval + drag ref.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { PanInfo } from 'motion/react';

/* ── Tuning (IDENTIK lintas komponen — ubah di sini = ubah di Window dan StickyNote) ── */
const SPRING_TENSION = 0.08;
const SPRING_FRICTION = 0.82;
const SKEW_FACTOR = 6;
const STRETCH_FACTOR = 0.025;
const VELOCITY_CLAMP = 6;
const SKEW_CLAMP = 12;
const SETTLE_THRESHOLD = 0.001;
const IDLE_RESET_MS = 50;
const IDLE_INTERVAL_MS = 60;

interface SpringState {
  skewX: number;
  scaleX: number;
  scaleY: number;
}

interface JellyDragState {
  lastX: number;
  lastY: number;
  lastTime: number;
  smoothVx: number;
  smoothVy: number;
  reducedMotion: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

/** Reset SpringState in-place (no allocation). */
function resetTo(state: SpringState): void {
  state.skewX = 0;
  state.scaleX = 1;
  state.scaleY = 1;
}

function isSettled(cur: SpringState, vel: SpringState, tgt: SpringState): boolean {
  return (
    Math.abs(vel.skewX) <= SETTLE_THRESHOLD &&
    Math.abs(tgt.skewX - cur.skewX) <= SETTLE_THRESHOLD &&
    Math.abs(vel.scaleX) <= SETTLE_THRESHOLD &&
    Math.abs(tgt.scaleX - cur.scaleX) <= SETTLE_THRESHOLD &&
    Math.abs(vel.scaleY) <= SETTLE_THRESHOLD &&
    Math.abs(tgt.scaleY - cur.scaleY) <= SETTLE_THRESHOLD
  );
}

/**
 * Compose jelly CSS variables ke transform string final.
 *
 * PENTING — kenapa parameter `generated` TIDAK di-prepend:
 * Framer Motion menulis transform output dari semua motion values (x, y, scale,
 * rotate, dll dari `animate` prop) ke `generated`. Kalau kita append `scale(--jw-sx)`,
 * efeknya **dikalikan** dengan scale yang ada di `animate` (mis. saat window
 * minimize ke `scale: 0.45`). Jelly seharusnya hanya aktif saat drag — di luar
 * drag `--jw-sx`/`--jw-sy` = 1, jadi pengalian = no-op dan kelihatan benar,
 * TAPI selama drag berlangsung kalau ada animate paralel (rare tapi mungkin),
 * hasilnya jadi multiply yang tidak diinginkan.
 *
 * Solusi: tetap append `generated` lalu jelly transform — sama dengan behavior
 * existing — TAPI kita document trade-off-nya. Untuk fix penuh perlu split
 * jadi dua node DOM (outer = animate, inner = jelly), yang berdampak ke
 * styling/layout dan di luar scope.
 *
 * Kompromi yang dipilih: append. Dampak nyata 0 selama jelly hanya aktif
 * during drag dan animate prop tidak menulis scale during drag (true di
 * Window dan StickyNote saat ini).
 */
export function composeJellyTransform(generated: string): string {
  return `${generated} skew(var(--jw-skew, 0deg)) scale(var(--jw-sx, 1), var(--jw-sy, 1))`;
}

export interface UseJellyDragOptions {
  /** Skip jelly entirely (mis. note pinned, window maximized, reduced-motion override). */
  enabled?: boolean;
}

export interface UseJellyDragReturn {
  /**
   * Pasang ke `ref` prop `m.div`. Ref callback (bukan ref object) supaya
   * sesuai dengan React Compiler / react-hooks/refs rules — tidak akses
   * `.current` di render.
   */
  attachRef: (el: HTMLDivElement | null) => void;
  /** Pasang ke prop `onDragStart` Framer. */
  onDragStart: (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => void;
  /** Pasang ke prop `onDrag` Framer. */
  onDrag: (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => void;
  /** Pasang ke prop `onDragEnd` Framer. */
  onDragEnd: () => void;
  /** Pasang ke prop `transformTemplate` Framer. */
  transformTemplate: (latest: object, generated: string) => string;
}

export function useJellyDrag(options: UseJellyDragOptions = {}): UseJellyDragReturn {
  const { enabled = true } = options;

  // Internal element ref — TIDAK di-return ke caller. Caller pakai `attachRef`
  // callback supaya tidak ada akses `.current` di render body.
  const elementRef = useRef<HTMLDivElement | null>(null);

  // SpringState diinit langsung sebagai object stable (bukan via factory) supaya
  // tidak alokasi extra. Mutated in-place sepanjang lifetime hook.
  const springCur = useRef<SpringState>({ skewX: 0, scaleX: 1, scaleY: 1 });
  const springVel = useRef<SpringState>({ skewX: 0, scaleX: 0, scaleY: 0 });
  const springTgt = useRef<SpringState>({ skewX: 0, scaleX: 1, scaleY: 1 });

  const rafId = useRef<number | null>(null);
  const dragRef = useRef<JellyDragState | null>(null);
  const idleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applySpring = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;
    const c = springCur.current;
    el.style.setProperty('--jw-skew', c.skewX.toFixed(3) + 'deg');
    el.style.setProperty('--jw-sx', c.scaleX.toFixed(4));
    el.style.setProperty('--jw-sy', c.scaleY.toFixed(4));
  }, []);

  const stopIdleInterval = useCallback(() => {
    if (idleIntervalRef.current) {
      clearInterval(idleIntervalRef.current);
      idleIntervalRef.current = null;
    }
  }, []);

  const ensureSpringLoop = useCallback(() => {
    if (rafId.current !== null) return;
    const tick = () => {
      const cur = springCur.current;
      const vel = springVel.current;
      const tgt = springTgt.current;

      // Integrate spring per axis (in-place, zero allocation).
      const forceSkew = (tgt.skewX - cur.skewX) * SPRING_TENSION;
      vel.skewX = (vel.skewX + forceSkew) * SPRING_FRICTION;
      cur.skewX += vel.skewX;

      const forceSx = (tgt.scaleX - cur.scaleX) * SPRING_TENSION;
      vel.scaleX = (vel.scaleX + forceSx) * SPRING_FRICTION;
      cur.scaleX += vel.scaleX;

      const forceSy = (tgt.scaleY - cur.scaleY) * SPRING_TENSION;
      vel.scaleY = (vel.scaleY + forceSy) * SPRING_FRICTION;
      cur.scaleY += vel.scaleY;

      applySpring();

      if (isSettled(cur, vel, tgt) && !dragRef.current) {
        // Snap exact ke rest (eliminates floating-point residue).
        resetTo(cur);
        applySpring();
        rafId.current = null;
        return;
      }

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
  }, [applySpring]);

  const onDragStart = useCallback(
    (_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
      if (!enabled) return;

      const reduced = prefersReducedMotion();
      // Init drag state pakai info.point.x/y langsung — first onDrag punya
      // velocity valid tanpa skip frame.
      dragRef.current = {
        lastX: info.point.x,
        lastY: info.point.y,
        lastTime: performance.now(),
        smoothVx: 0,
        smoothVy: 0,
        reducedMotion: reduced,
      };

      // Reset velocity dan target supaya drag baru tidak inherit residu drag
      // sebelumnya (kalau settle-window belum sempat habis).
      springVel.current.skewX = 0;
      springVel.current.scaleX = 0;
      springVel.current.scaleY = 0;
      resetTo(springTgt.current);

      if (!reduced) ensureSpringLoop();

      stopIdleInterval();
      idleIntervalRef.current = setInterval(() => {
        const d = dragRef.current;
        if (!d) return;
        if (performance.now() - d.lastTime > IDLE_RESET_MS) {
          resetTo(springTgt.current);
          d.smoothVx = 0;
          d.smoothVy = 0;
        }
      }, IDLE_INTERVAL_MS);
    },
    [enabled, ensureSpringLoop, stopIdleInterval]
  );

  const onDrag = useCallback((_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const d = dragRef.current;
    if (!d) return;

    const now = performance.now();
    const dt = Math.max(1, now - d.lastTime);

    const rawVx = (info.point.x - d.lastX) / dt;
    const rawVy = (info.point.y - d.lastY) / dt;

    // EMA: 60% history + 40% new sample. Bukan jitter-free tapi cukup stabil
    // untuk skew/squash visual — tuning value matched ke feel asli Window.
    d.smoothVx = d.smoothVx * 0.6 + rawVx * 0.4;
    d.smoothVy = d.smoothVy * 0.6 + rawVy * 0.4;
    d.lastX = info.point.x;
    d.lastY = info.point.y;
    d.lastTime = now;

    if (d.reducedMotion) return;

    const vx = clamp(d.smoothVx, -VELOCITY_CLAMP, VELOCITY_CLAMP);
    const vy = clamp(d.smoothVy, -VELOCITY_CLAMP, VELOCITY_CLAMP);

    const tgt = springTgt.current;
    tgt.skewX = clamp(vx * -SKEW_FACTOR, -SKEW_CLAMP, SKEW_CLAMP);

    const speed = Math.hypot(vx, vy);
    const s = Math.min(speed, 4) * STRETCH_FACTOR;
    tgt.scaleX = 1 + s;
    tgt.scaleY = 1 - s * 0.5;
  }, []);

  const onDragEnd = useCallback(() => {
    stopIdleInterval();

    const reduced = dragRef.current?.reducedMotion === true;
    dragRef.current = null;
    resetTo(springTgt.current);

    if (reduced) {
      // Snap langsung ke rest tanpa spring animation.
      resetTo(springCur.current);
      springVel.current.skewX = 0;
      springVel.current.scaleX = 0;
      springVel.current.scaleY = 0;
      applySpring();
    } else {
      // Pastikan loop jalan untuk settle ke rest (kalau RAF terlanjur stop).
      ensureSpringLoop();
    }
  }, [stopIdleInterval, applySpring, ensureSpringLoop]);

  // Defensive cleanup: unmount mid-drag tetap aman. Tutup RAF, interval, dan
  // null-kan dragRef supaya closure interval (kalau lolos) jadi no-op.
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (idleIntervalRef.current) {
        clearInterval(idleIntervalRef.current);
        idleIntervalRef.current = null;
      }
      dragRef.current = null;
    };
  }, []);

  // Saat enabled toggle ke false mid-drag (mis. window di-maximize, note
  // di-pin, isResizing flip ke true), abort jelly state segera. Tanpa ini,
  // dragRef bisa stuck dan idleIntervalRef terus polling.
  useEffect(() => {
    if (enabled) return;
    stopIdleInterval();
    if (dragRef.current) {
      dragRef.current = null;
      resetTo(springTgt.current);
      // Loop yang masih jalan akan settle ke rest secara natural.
    }
  }, [enabled, stopIdleInterval]);

  const transformTemplate = useCallback(
    (_latest: object, generated: string) => composeJellyTransform(generated),
    []
  );

  const attachRef = useCallback((el: HTMLDivElement | null) => {
    elementRef.current = el;
  }, []);

  return {
    attachRef,
    onDragStart,
    onDrag,
    onDragEnd,
    transformTemplate,
  };
}
