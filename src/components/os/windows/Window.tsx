'use client';

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { m, useDragControls, AnimatePresence, Transition, TargetAndTransition } from 'motion/react';
import { soundManager } from '../utils/SoundManager';
import { useWindowResize } from '../hooks/useWindowResize';
import { useWindowKeyboard } from '../hooks/useWindowKeyboard';
import { WindowTitleBar } from './components/WindowTitleBar';
import { WindowResizeHandles } from './components/WindowResizeHandles';

/* ── Spring constants ───────────────────────────────────────────── */
const SPRING_TENSION  = 0.08;
const SPRING_FRICTION = 0.82;
const SKEW_FACTOR    = 6;      
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
function springRest(): SpringState { return { ...SPRING_REST }; }

// Module-level constants to avoid re-creation per render
const SHELL_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.80)',
  filter: 'blur(0px) saturate(1)',
} as const;

const SHELL_STYLE_MAXIMIZED = {
  backgroundColor: 'rgba(255,255,255,0.88)',
  filter: 'blur(0px) saturate(1)',
} as const;

const MINIMIZED_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.62)',
  filter: 'blur(10px) saturate(0.9)',
} as const;

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  isMinimized?: boolean;
  isMaximized?: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onFocus?: () => void;
  zIndex?: number;
  initialPosition?: { x: number; y: number }; // Default position
  minimizeTarget?: { x: number; y: number }; // Target for minimize animation
  noPadding?: boolean;
  onUpdatePosition?: (x: number, y: number) => void;
  width?: number;
  height?: number;
  onResize?: (width: number, height: number) => void;
  onResizeEnd?: (width: number, height: number) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isAdmin?: boolean;
  animationVariant?: 'genie' | 'scale' | 'tv' | 'snap';
  isFocused?: boolean;
  /** Origin rect from the icon that launched this window (for Apple-style morph) */
  originRect?: { x: number; y: number; width: number; height: number };
  /** Shared layoutId for Framer Motion layout morph animation */
  layoutId?: string;
}

export default function OSWindow({
  id,
  title,
  children,
  isOpen,
  isMinimized = false,
  isMaximized = false,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  zIndex = 10,
  initialPosition = { x: 100, y: 100 },
  noPadding = false,
  onUpdatePosition,
  width,
  height,
  onResize,
  onResizeEnd,
  isPinned = false,
  onTogglePin,
  isAdmin = false,
  isFocused = false,
  animationVariant: _animationVariant,
  originRect,
}: WindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);

  // ── Jelly Physics State ──
  const springCur = useRef<SpringState>(springRest());
  const springVel = useRef<SpringState>(springRest());
  const springTgt = useRef<SpringState>(springRest());
  const rafId     = useRef<number | null>(null);

  const jellyDragRef = useRef<{
    lastX: number;
    lastY: number;
    lastTime: number;
    smoothVx: number;
    smoothVy: number;
    reducedMotion: boolean;
  } | null>(null);
  
  const idleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
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
        vel[k]  = (vel[k] + force) * SPRING_FRICTION;
        cur[k] += vel[k];
        if (Math.abs(vel[k]) > 0.001 || Math.abs(tgt[k] - cur[k]) > 0.001) settled = false;
      }

      applySpring();
      if (settled && !jellyDragRef.current) {
        Object.assign(cur, springRest());
        applySpring();
        rafId.current = null;
      } else {
        rafId.current = requestAnimationFrame(tick);
      }
    };
    rafId.current = requestAnimationFrame(tick);
  }, [applySpring]);

  // RESIZE FIX: viewport sekarang dynamic — rotate device / resize browser
  // akan me-recompute maximizedFrame + clamps agar window tidak keluar layar.
  const [viewport, setViewport] = useState(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 1440, height: 900 };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId = 0;
    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setViewport({ width: window.innerWidth, height: window.innerHeight });
      });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const viewportWidth = viewport.width;
  const viewportHeight = viewport.height;

  const { isSmallScreen, winWidth } = useMemo(() => {
    const isMobile = viewportWidth < 768;
    const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
    return {
      isSmallScreen: isMobile || isTablet,
      winWidth: isMobile ? viewportWidth : isTablet ? Math.min(viewportWidth - 32, 700) : 600,
    };
  }, [viewportWidth]);

  const dragControls = useDragControls();

  const { handleKeyDown } = useWindowKeyboard({ onClose, onMinimize, onMaximize });
  const { dynamicSize, isResizing, handleResizeStart } = useWindowResize({
    initialWidth: width,
    initialHeight: height,
    onResize,
    onResizeEnd,
  });

  // Sound effect on open - delay until user interaction
  useEffect(() => {
    if (isOpen) {
      // Use setTimeout to ensure user interaction is detected first
      const timer = setTimeout(() => {
        soundManager.play('window-open');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle auto-focus when window becomes active
  useEffect(() => {
    if (isFocused && windowRef.current) {
      windowRef.current.focus({ preventScroll: true });
    }
  }, [isFocused]);

  const measuredWidth = dynamicSize.width || width || winWidth;
  const measuredHeight = dynamicSize.height || height || 600;

  const normalFrame = useMemo(
    () => ({
      x: isSmallScreen ? 8 : initialPosition.x,
      y: isSmallScreen ? 44 : initialPosition.y, // 36px menubar + 8px gap
      width: isSmallScreen ? viewportWidth - 16 : measuredWidth,
      height: isSmallScreen ? viewportHeight - 146 : measuredHeight, // leaves room for dock + generous gap margins
    }),
    [isSmallScreen, initialPosition.x, initialPosition.y, measuredWidth, measuredHeight, viewportWidth, viewportHeight]
  );

  const maximizedFrame = useMemo(
    () => ({
      x: 10,
      y: 36,
      width: Math.max(viewportWidth - 20, 320),
      height: Math.max(viewportHeight - 46, 240),
    }),
    [viewportWidth, viewportHeight]
  );

  const activeFrame = isMaximized ? maximizedFrame : normalFrame;

  const shellStyle = useMemo(() => {
    const base = isMaximized ? SHELL_STYLE_MAXIMIZED : SHELL_STYLE;
    if (isSmallScreen) {
      return {
        ...base,
        backgroundColor: 'rgba(255, 255, 255, 0.94)', // More opaque fallback for mobile legibility
      };
    }
    return base;
  }, [isMaximized, isSmallScreen]);

  // ── Animation states based on originRect (icon position) ──
  // When originRect is available: window expands FROM icon and shrinks BACK to icon
  const hasOrigin = !!originRect;

  // Entry: start at icon's position and size, then expand to full window
  const entryState = hasOrigin
    ? {
        x: originRect!.x,
        y: originRect!.y,
        width: originRect!.width,
        height: originRect!.height,
        opacity: 0,
        scale: 1,
        borderRadius: 12, // Match iOS icon radius roughly
        backgroundColor: 'rgba(255,255,255,0.40)',
        filter: 'blur(6px) saturate(0.80)',
      }
    : {
        x: activeFrame.x,
        y: activeFrame.y,
        scale: 0.85,
        opacity: 0,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.70)',
        filter: 'blur(4px) saturate(0.92)',
      };

  // Minimized / Close target: shrink back into icon position
  const minimizedState = hasOrigin
    ? {
        x: originRect!.x,
        y: originRect!.y,
        width: originRect!.width,
        height: originRect!.height,
        scale: 0.45,
        opacity: 0,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.30)',
        filter: 'blur(10px) saturate(0.6)',
      }
    : {
        x: activeFrame.x,
        y: activeFrame.y,
        scale: 0.82,
        opacity: 0,
        borderRadius: 26,
        ...MINIMIZED_STYLE,
      };

  const activeState = {
    x: activeFrame.x,
    y: activeFrame.y,
    scale: 1,
    opacity: 1,
    width: activeFrame.width,
    height: activeFrame.height,
    borderRadius: isMaximized ? 14 : 22, // iOS-style window radius
    ...shellStyle,
  };

  // Spring physics — Deep iOS Analysis Refinement
  // Opening: Luxurious & Fluid
  const standardTransition = {
    x: { type: 'spring', stiffness: 180, damping: 25, mass: 1 },
    y: { type: 'spring', stiffness: 180, damping: 25, mass: 1 },
    width: { type: 'spring', stiffness: 180, damping: 25, mass: 1 },
    height: { type: 'spring', stiffness: 180, damping: 25, mass: 1 },
    scale: { type: 'spring', stiffness: 180, damping: 25, mass: 1 },
    opacity: { duration: 0.28, ease: 'easeOut' },
    borderRadius: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
    filter: { duration: 0.3, ease: 'easeOut' },
    backgroundColor: { duration: 0.3, ease: 'easeOut' },
  } as Transition;

  // Minimize/close: Snappy & Responsive (Vacuum effect)
  const minimizeTransition = {
    x: { type: 'spring', stiffness: 220, damping: 28, mass: 1 },
    y: { type: 'spring', stiffness: 220, damping: 28, mass: 1 },
    width: { type: 'spring', stiffness: 220, damping: 28, mass: 1 },
    height: { type: 'spring', stiffness: 220, damping: 28, mass: 1 },
    scale: { type: 'spring', stiffness: 220, damping: 28, mass: 1 },
    opacity: { duration: 0.22, ease: 'easeIn' },
    borderRadius: { duration: 0.25, ease: 'easeIn' },
    filter: { duration: 0.22, ease: 'easeIn' },
    backgroundColor: { duration: 0.22, ease: 'easeIn' },
  } as Transition;

  // Exit: fly back into icon position
  const exitState = hasOrigin
    ? ({
        ...minimizedState,
        transition: minimizeTransition,
      } as TargetAndTransition)
    : ({
        scale: 0.85,
        opacity: 0,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.66)',
        filter: 'blur(4px) saturate(0.92)',
        transition: {
          opacity: { duration: 0.16 },
          scale: { type: 'spring', stiffness: 210, damping: 28 },
          filter: { duration: 0.16 },
        },
      } as TargetAndTransition);

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          ref={windowRef}
          drag={!isMaximized && !isResizing && (!isPinned || isAdmin) && !isSmallScreen}
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          onDragStart={(e, info) => {
            if (isMaximized || isResizing || isSmallScreen || (isPinned && !isAdmin)) return;
            const reduced = prefersReducedMotion();
            jellyDragRef.current = {
              lastX: info.point.x,
              lastY: info.point.y,
              lastTime: performance.now(),
              smoothVx: 0,
              smoothVy: 0,
              reducedMotion: reduced,
            };
            springVel.current = { skewX: 0, scaleX: 0, scaleY: 0 };
            springTgt.current = springRest();
            
            if (!reduced) ensureSpringLoop();
            
            if (idleIntervalRef.current) clearInterval(idleIntervalRef.current);
            idleIntervalRef.current = setInterval(() => {
              const d = jellyDragRef.current;
              if (!d) return;
              if (performance.now() - d.lastTime > 50) {
                springTgt.current = springRest();
                d.smoothVx = 0;
                d.smoothVy = 0;
              }
            }, 60);
          }}
          onDrag={(e, info) => {
            const d = jellyDragRef.current;
            if (!d) return;
            const now = performance.now();
            const dt = Math.max(1, now - d.lastTime);
            const rawVx = (info.point.x - d.lastX) / dt;
            const rawVy = (info.point.y - d.lastY) / dt;
            
            d.smoothVx = d.smoothVx * 0.6 + rawVx * 0.4;
            d.smoothVy = d.smoothVy * 0.6 + rawVy * 0.4;
            d.lastX = info.point.x;
            d.lastY = info.point.y;
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
          }}
          onDragEnd={(e, info) => {
            if (idleIntervalRef.current) {
              clearInterval(idleIntervalRef.current);
              idleIntervalRef.current = null;
            }
            
            const reduced = jellyDragRef.current?.reducedMotion;
            jellyDragRef.current = null;
            springTgt.current = springRest();
            
            if (reduced) {
              springCur.current = springRest();
              springVel.current = { skewX: 0, scaleX: 0, scaleY: 0 };
              applySpring();
            }
            
            if (!isMaximized && !isMinimized && (!isPinned || isAdmin) && onUpdatePosition) {
              const newX = initialPosition.x + info.offset.x;
              const newY = initialPosition.y + info.offset.y;
              onUpdatePosition(newX, newY);
            }
          }}
          transformTemplate={(_, generated) => {
            // Integrate jelly physics with Framer Motion's transform
            return `${generated} skew(var(--jw-skew, 0deg)) scale(var(--jw-sx, 1), var(--jw-sy, 1))`;
          }}
          initial={
            hasOrigin
              ? {
                  ...entryState,
                }
              : {
                  ...entryState,
                  width: activeFrame.width,
                  height: activeFrame.height,
                }
          }
          animate={isMinimized ? minimizedState : activeState}
          transition={
            isResizing ? { duration: 0 } : isMinimized ? minimizeTransition : standardTransition
          }
          exit={exitState}
          layoutId={undefined}
          layout={false}
          onPointerDown={onFocus}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          aria-modal="true"
          role="dialog"
          aria-label={title}
          data-window-id={id}
          data-testid="window-frame"
          style={{
            position: 'absolute',
            zIndex: zIndex,
            top: 0,
            left: 0,
            transformOrigin: '50% 50%',
            pointerEvents: isMinimized ? 'none' : 'auto',
            backdropFilter: isMinimized
              ? 'none'
              : isSmallScreen
                ? 'none' // Disable GPU intensive backdrop filter on mobile
                : isFocused
                  ? 'blur(24px) saturate(1.2)'
                  : 'blur(12px) saturate(1)',
            transition: 'backdrop-filter 0.3s ease',
          }}
          data-lenis-prevent
          className="flex flex-col overflow-hidden rounded-[18px] border border-white/45 outline-none will-change-transform"
        >
          {/* Title Bar */}
          <WindowTitleBar
            title={title}
            isMaximized={isMaximized}
            isPinned={isPinned}
            isAdmin={isAdmin}
            onClose={onClose}
            onMinimize={onMinimize}
            onMaximize={onMaximize}
            onTogglePin={onTogglePin}
            onDragStart={(e) => dragControls.start(e)}
            onFocus={onFocus}
          />

          {/* Window Content */}
          <div
            data-lenis-prevent
            style={{ touchAction: 'auto' }}
            className={`relative w-full flex-1 overflow-hidden bg-white/50 ${noPadding ? '' : 'p-4'}`}
          >
            {children}

            {/* Safe Zone for Resize Overlays (Only if not maximized and resizable) */}
            {!isMaximized && !isSmallScreen && onResize && (
              <WindowResizeHandles onResizeStart={handleResizeStart} />
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
