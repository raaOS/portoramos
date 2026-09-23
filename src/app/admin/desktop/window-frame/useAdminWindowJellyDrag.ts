'use client';

import { useCallback, useRef, useEffect } from 'react';
import type { AdminWindowState, AdminDesktopActions } from '../types';

const SPRING_TENSION = 0.08;
const SPRING_FRICTION = 0.82;
const SKEW_FACTOR = 6;
const STRETCH_FACTOR = 0.025;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

interface SpringState {
  skewX: number;
  scaleX: number;
  scaleY: number;
}

const SPRING_REST: SpringState = { skewX: 0, scaleX: 1, scaleY: 1 };

function springRest(): SpringState {
  return { ...SPRING_REST };
}

interface UseAdminWindowJellyDragOptions {
  state: AdminWindowState;
  actions: AdminDesktopActions;
}

export function useAdminWindowJellyDrag({ state, actions }: UseAdminWindowJellyDragOptions) {
  const windowRef = useRef<HTMLDivElement | null>(null);
  const springCur = useRef<SpringState>(springRest());
  const springVel = useRef<SpringState>(springRest());
  const springTgt = useRef<SpringState>(springRest());
  const rafId = useRef<number | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    smoothVx: number;
    smoothVy: number;
    reducedMotion: boolean;
  } | null>(null);

  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const applySpring = useCallback(() => {
    const el = windowRef.current;
    if (!el) return;
    const c = springCur.current;
    el.style.setProperty('--jw-skew', `${c.skewX.toFixed(3)}deg`);
    el.style.setProperty('--jw-sx', c.scaleX.toFixed(4));
    el.style.setProperty('--jw-sy', c.scaleY.toFixed(4));
  }, []);

  const ensureSpringLoop = useCallback(() => {
    if (rafId.current !== null) return;

    const tick = () => {
      const cur = springCur.current;
      const vel = springVel.current;
      const tgt = springTgt.current;

      let settled = true;

      for (const k of ['skewX', 'scaleX', 'scaleY'] as const) {
        const force = (tgt[k] - cur[k]) * SPRING_TENSION;
        vel[k] = (vel[k] + force) * SPRING_FRICTION;
        cur[k] += vel[k];

        if (Math.abs(vel[k]) > 0.001 || Math.abs(tgt[k] - cur[k]) > 0.001) {
          settled = false;
        }
      }

      applySpring();

      if (settled && !dragRef.current) {
        Object.assign(cur, springRest());
        applySpring();
        windowRef.current?.classList.remove('admin-window-wobbling');
        rafId.current = null;
      } else {
        rafId.current = requestAnimationFrame(tick);
      }
    };

    rafId.current = requestAnimationFrame(tick);
  }, [applySpring]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (state.isMaximized) return;
      e.preventDefault();
      actions.bringToFront(state.id);
      dragCleanupRef.current?.();

      const reduced = prefersReducedMotion();

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: state.x,
        originY: state.y,
        lastX: e.clientX,
        lastY: e.clientY,
        lastTime: performance.now(),
        smoothVx: 0,
        smoothVy: 0,
        reducedMotion: reduced,
      };

      windowRef.current?.classList.add('admin-window-wobbling');
      springVel.current = { skewX: 0, scaleX: 0, scaleY: 0 };
      springTgt.current = springRest();

      if (!reduced) ensureSpringLoop();

      const onMove = (ev: MouseEvent) => {
        const d = dragRef.current;
        if (!d) return;

        const dx = ev.clientX - d.startX;
        const dy = ev.clientY - d.startY;

        actions.updatePosition(state.id, d.originX + dx, d.originY + dy);

        const now = performance.now();
        const dt = Math.max(1, now - d.lastTime);
        const rawVx = (ev.clientX - d.lastX) / dt;
        const rawVy = (ev.clientY - d.lastY) / dt;
        d.smoothVx = d.smoothVx * 0.6 + rawVx * 0.4;
        d.smoothVy = d.smoothVy * 0.6 + rawVy * 0.4;

        d.lastX = ev.clientX;
        d.lastY = ev.clientY;
        d.lastTime = now;

        if (d.reducedMotion) return;

        const vx = clamp(d.smoothVx, -6, 6);
        const vy = clamp(d.smoothVy, -6, 6);

        const tgt = springTgt.current;
        tgt.skewX = clamp(vx * -SKEW_FACTOR, -12, 12);

        const speed = Math.hypot(vx, vy);
        const s = Math.min(speed, 4) * STRETCH_FACTOR;
        tgt.scaleX = 1 + s;
        tgt.scaleY = 1 - s * 0.5;
      };

      const idleInterval = setInterval(() => {
        const d = dragRef.current;
        if (!d) return;
        if (performance.now() - d.lastTime > 50) {
          springTgt.current = springRest();
          d.smoothVx = 0;
          d.smoothVy = 0;
        }
      }, 60);

      const onUp = () => {
        clearInterval(idleInterval);
        dragRef.current = null;
        springTgt.current = springRest();

        if (reduced) {
          springCur.current = springRest();
          springVel.current = { skewX: 0, scaleX: 0, scaleY: 0 };
          applySpring();
          windowRef.current?.classList.remove('admin-window-wobbling');
        }

        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        dragCleanupRef.current = null;
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      dragCleanupRef.current = onUp;
    },
    [state.id, state.x, state.y, state.isMaximized, actions, ensureSpringLoop, applySpring]
  );

  return {
    windowRef,
    handleDragStart,
  };
}
