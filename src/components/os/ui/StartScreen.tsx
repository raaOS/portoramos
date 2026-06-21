'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { m } from 'motion/react';
import { soundManager } from '../utils/SoundManager';

interface StartScreenProps {
  onStart: () => void;
  isActive: boolean;
  onReady?: () => void;
  onReveal?: () => void;
}

type ScreenState = 'idle' | 'zooming' | 'showingText' | 'glassReveal' | 'done';

/**
 * BOOT ANIMATION SEQUENCE — DO NOT REORDER OR ADD GAPS.
 *
 * Original design (raaOS/portoramos):
 * ┌──────────┬─────────────────────┬────────────────────────────────┐
 * │ Phase    │ Duration            │ Visual                         │
 * ├──────────┼─────────────────────┼────────────────────────────────┤
 * │ idle     │ until user clicks   │ Hollow-O keyhole + "Click to   │
 * │          │                     │ Start" text on black bg        │
 * │ zooming  │ 1200ms              │ Hollow-O scales to 300×        │
 * │ showing  │ 2000ms              │ RAMOS wordmark text fades in   │
 * │ Text     │ (1000ms after zoom) │ inside the O at scale 1        │
 * │ glass    │ 1500ms              │ White mask hole scales 100×,   │
 * │ Reveal   │ (3200ms from start) │ revealing desktop through O.   │
 * │          │                     │ Wordmark scales with mask as   │
 * │          │                     │ intentional visual transition. │
 * │ done     │ 4700ms from start   │ StartScreen unmounts           │
 * └──────────┴─────────────────────┴────────────────────────────────┘
 *
 * CRITICAL: The wordmark text is INSIDE the scaling SVG by design.
 * When glassReveal scales the mask to 100×, the wordmark also scales
 * and disappears — this creates the visual of the O "opening" to reveal
 * the desktop. Do NOT split the wordmark into a separate non-scaling
 * layer — that breaks the intended transition.
 *
 * Mask hole alignment: the O-ring center (31.056, 4.345) maps to
 * (50, 50) via group transform: translate(50,50) scale(0.6) translate(-31.056,-4.345).
 * The mask hole at (50, 50) aligns perfectly with the first O in "RAMOS".
 */

const REVEAL_OVERLAP_MS = 200;

const BOOT_CONFIG = {
  keyholeZoomDuration: 1200,
  textFadeInDuration: 1000,
  textDisplayDuration: 2000,
  revealDuration: 1500,
  allowSkip: true,
  /** Text starts fading in 200ms before zoom completes. */
  get showTextDelay() {
    return this.keyholeZoomDuration - REVEAL_OVERLAP_MS;
  },
  /** Hole starts growing after text has been displayed for the full duration. */
  get glassRevealDelay() {
    return this.keyholeZoomDuration + this.textDisplayDuration - REVEAL_OVERLAP_MS;
  },
  /** Complete after hole finishes expanding. */
  get completeDelay() {
    return this.glassRevealDelay + this.revealDuration;
  },
};

const textFadeTransition = {
  duration: BOOT_CONFIG.textFadeInDuration / 1000,
  ease: [0.4, 0, 0.2, 1],
} as const;

const revealScaleTransition = {
  duration: BOOT_CONFIG.revealDuration / 1000,
  ease: [0.76, 0, 0.24, 1],
} as const;

const StartScreen = ({ onStart, isActive, onReady, onReveal }: StartScreenProps) => {
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const revealRafRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);
  const maskId = `hollow-o-mask-${useId().replace(/:/g, '')}`;

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];

      if (revealRafRef.current !== null) {
        window.cancelAnimationFrame(revealRafRef.current);
      }
    };
  }, []);

  const queueTimer = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay);
    timersRef.current.push(timer);
  }, []);

  const handleClick = useCallback(() => {
    if (screenState !== 'idle' || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    soundManager.unlock();
    soundManager.play('startup');
    setScreenState('zooming');

    queueTimer(() => {
      setScreenState('showingText');
    }, BOOT_CONFIG.showTextDelay);

    queueTimer(() => {
      setScreenState('glassReveal');

      if (typeof window === 'undefined') {
        onReveal?.();
        return;
      }

      revealRafRef.current = window.requestAnimationFrame(() => {
        onReveal?.();
        revealRafRef.current = null;
      });
    }, BOOT_CONFIG.glassRevealDelay);

    queueTimer(() => {
      setScreenState('done');
      onStart();
    }, BOOT_CONFIG.completeDelay);
  }, [onReveal, onStart, queueTimer, screenState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.code !== 'Enter') {
        return;
      }

      event.preventDefault();

      if (screenState === 'idle') {
        handleClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick, screenState]);

  if (!isActive || screenState === 'done') {
    return null;
  }

  const isWordmarkVisible = screenState === 'showingText' || screenState === 'glassReveal';
  const masterFrameColor =
    screenState === 'idle' || screenState === 'zooming' ? '#000000' : '#ffffff';

  return (
    <m.div
      id="start-screen"
      data-testid="os-start-screen"
      data-boot-state={screenState}
      className="fixed inset-0 z-[999999] h-full w-full select-none overflow-hidden bg-transparent print:hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      style={{ pointerEvents: screenState === 'glassReveal' ? 'none' : 'auto' }}
    >
      {/* --- REVEAL LAYER: white mask with growing hole --- */}
      <m.div
        className="pointer-events-none absolute inset-0 z-[10002] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isWordmarkVisible ? 1 : 0,
          scale: screenState === 'glassReveal' ? 100 : 1,
        }}
        transition={{
          opacity: { duration: 0.35, ease: 'easeInOut' },
          scale:
            screenState === 'glassReveal'
              ? revealScaleTransition
              : { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
        }}
        style={{ transformOrigin: '50% 50%' }}
        data-boot-layer="reveal"
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          <defs>
            <mask id={maskId}>
              <rect x="0" y="0" width="100" height="100" fill="white" />
              <circle cx="50" cy="50" r="2.235" fill="black" />
            </mask>
          </defs>

          <rect x="0" y="0" width="100" height="100" fill="#ffffff" mask={`url(#${maskId})`} />

          {/* CRITICAL PORTAL COVER:
              This circle covers the transparent mask hole at (50,50) during the unblurring text phase.
              - MUST use fill="#ffffff" (white) to match the screen background, keeping the first 'O' hollow
                and identical to the second 'O' (instead of looking solid black).
              - MUST remain opaque (opacity: 1) during 'showingText' to hide the desktop background.
              - ONLY fades out (opacity: 0) during 'glassReveal' to reveal the desktop through the 'O' 
                portal simultaneously as the zoom-in scaling transition runs. */}
          <m.circle
            cx="50"
            cy="50"
            r="2.235"
            fill="#ffffff"
            initial={{ opacity: 1 }}
            animate={{ opacity: screenState === 'glassReveal' ? 0 : 1 }}
            transition={{
              duration: screenState === 'glassReveal' ? 0.5 : 0.2,
              ease: 'easeInOut',
            }}
          />

          {/* RAMOS wordmark — INSIDE scaling SVG by design.
              Scales with the mask during glassReveal as part of the transition. */}
          <m.g
            transform="translate(50, 50) scale(0.6) translate(-31.056, -4.345)"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{
              opacity: isWordmarkVisible ? 1 : 0,
              filter: isWordmarkVisible ? 'blur(0px)' : 'blur(10px)',
            }}
            transition={textFadeTransition}
          >
            <g fill="black">
              <path d="M 1.8 8.545 L 0 8.545 L 0 0.145 L 3.264 0.145 Q 4.284 0.145 4.962 0.499 Q 5.64 0.853 5.97 1.441 Q 6.3 2.029 6.3 2.749 Q 6.3 3.421 5.982 4.009 Q 5.664 4.597 4.992 4.957 Q 4.32 5.317 3.252 5.317 L 1.8 5.317 L 1.8 8.545 Z M 1.8 1.645 L 1.8 4.021 L 3.156 4.021 Q 3.828 4.021 4.146 3.697 Q 4.464 3.373 4.464 2.821 Q 4.464 2.281 4.146 1.963 Q 3.828 1.645 3.156 1.645 L 1.8 1.645 Z M 6.372 8.545 L 4.332 8.545 L 2.64 4.873 L 4.572 4.873 L 6.372 8.545 Z" />
              <path
                transform="translate(-0.3, 0)"
                d="M 9.012 8.545 L 7.128 8.545 L 10.188 0.145 L 12.252 0.145 L 15.312 8.545 L 13.404 8.545 L 11.208 2.173 L 9.012 8.545 Z M 13.812 6.709 L 8.46 6.709 L 8.94 5.317 L 13.344 5.317 L 13.812 6.709 Z"
              />
              <path
                transform="translate(-0.6, 0)"
                d="M 18.156 8.545 L 16.356 8.545 L 16.356 0.145 L 18.516 0.145 L 20.964 5.197 L 23.388 0.145 L 25.536 0.145 L 25.536 8.545 L 23.736 8.545 L 23.736 3.181 L 21.672 7.369 L 20.232 7.369 L 18.156 3.181 L 18.156 8.545 Z"
              />
              <path
                transform="translate(0.6, 0)"
                d="M 36.3 6.001 L 38.22 6.001 Q 38.232 6.349 38.4 6.613 Q 38.568 6.877 38.856 7.027 Q 39.144 7.177 39.528 7.177 Q 39.852 7.177 40.098 7.075 Q 40.344 6.973 40.488 6.775 Q 40.632 6.577 40.632 6.277 Q 40.632 5.965 40.464 5.743 Q 40.296 5.521 40.008 5.359 Q 39.72 5.197 39.342 5.059 Q 38.964 4.921 38.532 4.789 Q 37.536 4.465 37.002 3.913 Q 36.468 3.361 36.468 2.437 Q 36.468 1.669 36.846 1.123 Q 37.224 0.577 37.884 0.289 Q 38.544 0.001 39.384 0.001 Q 40.248 0.001 40.902 0.295 Q 41.556 0.589 41.946 1.147 Q 42.336 1.705 42.36 2.473 L 40.428 2.473 Q 40.416 2.209 40.278 1.993 Q 40.14 1.777 39.906 1.645 Q 39.672 1.513 39.36 1.513 Q 39.084 1.501 38.856 1.591 Q 38.628 1.681 38.496 1.867 Q 38.364 2.053 38.364 2.329 Q 38.364 2.593 38.502 2.791 Q 38.64 2.989 38.886 3.127 Q 39.132 3.265 39.462 3.385 Q 39.792 3.505 40.188 3.625 Q 40.824 3.841 41.358 4.135 Q 41.892 4.429 42.222 4.903 Q 42.552 5.377 42.552 6.157 Q 42.552 6.841 42.198 7.417 Q 41.844 7.993 41.178 8.341 Q 40.512 8.689 39.528 8.689 Q 38.628 8.689 37.902 8.383 Q 37.176 8.077 36.756 7.477 Q 36.336 6.877 36.3 6.001 Z"
              />
            </g>

            <circle cx="31.056" cy="4.345" r="3.8" fill="none" stroke="black" strokeWidth="1.8" />

            <g transform="translate(1.1, 0)">
              <circle cx="50.532" cy="4.345" r="3.8" fill="none" stroke="black" strokeWidth="1.8" />
              <path d="M 55.776 6.001 L 57.696 6.001 Q 57.708 6.349 57.876 6.613 Q 58.044 6.877 58.332 7.027 Q 58.62 7.177 59.004 7.177 Q 59.328 7.177 59.574 7.075 Q 59.82 6.973 59.964 6.775 Q 60.108 6.577 60.108 6.277 Q 60.108 5.965 59.94 5.743 Q 59.772 5.521 59.484 5.359 Q 59.196 5.197 58.818 5.059 Q 58.44 4.921 58.008 4.789 Q 57.012 4.465 56.478 3.913 Q 55.944 3.361 55.944 2.437 Q 55.944 1.669 56.322 1.123 Q 56.7 0.577 57.36 0.289 Q 58.02 0.001 58.86 0.001 Q 59.724 0.001 60.378 0.295 Q 61.032 0.589 61.422 1.147 Q 61.812 1.705 61.836 2.473 L 59.904 2.473 Q 59.892 2.209 59.754 1.993 Q 59.616 1.777 59.382 1.645 Q 59.148 1.513 58.836 1.513 Q 58.56 1.501 58.332 1.591 Q 58.104 1.681 57.972 1.867 Q 57.84 2.053 57.84 2.329 Q 57.84 2.593 57.978 2.791 Q 58.116 2.989 58.362 3.127 Q 58.608 3.265 58.938 3.385 Q 59.268 3.505 59.664 3.625 Q 60.3 3.841 60.834 4.135 Q 61.368 4.429 61.698 4.903 Q 62.028 5.377 62.028 6.157 Q 62.028 6.841 61.674 7.417 Q 61.32 7.993 60.654 8.341 Q 59.988 8.689 59.004 8.689 Q 58.104 8.689 57.378 8.383 Q 56.652 8.077 56.232 7.477 Q 55.812 6.877 55.776 6.001 Z" />
            </g>
          </m.g>
        </svg>
      </m.div>

      {/* --- BACKGROUND COLOR OVERLAY --- */}
      <m.div
        className="absolute inset-0 z-[10000]"
        animate={{
          opacity: screenState === 'idle' || screenState === 'zooming' ? 1 : 0,
          backgroundColor: masterFrameColor,
        }}
        transition={{
          opacity: {
            duration: screenState === 'glassReveal' ? 0 : 0.8,
            ease: 'easeInOut',
          },
          backgroundColor: { duration: 0 },
        }}
      />

      {/* --- KEYHOLE ICON LAYER: Hollow-O + Click to Start --- */}
      <m.div
        className="absolute inset-0 z-[10001] flex items-center justify-center"
        style={{ pointerEvents: screenState === 'idle' ? 'auto' : 'none' }}
        onClick={screenState === 'idle' ? handleClick : undefined}
        animate={{ opacity: screenState === 'idle' || screenState === 'zooming' ? 1 : 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        <m.div
          className="relative flex cursor-pointer items-center justify-center will-change-transform"
          layout={false}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: screenState === 'idle' ? 1 : 300,
            opacity: 1,
          }}
          transition={{
            scale:
              screenState === 'idle'
                ? { type: 'spring', stiffness: 260, damping: 20 }
                : {
                    duration: BOOT_CONFIG.keyholeZoomDuration / 1000,
                    ease: [0.76, 0, 0.24, 1],
                  },
            opacity: { duration: 0.5 },
          }}
        >
          <m.div
            className="relative flex items-center justify-center text-[#ffffff]"
            whileHover={screenState === 'idle' ? { scale: 1.05 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ duration: screenState === 'idle' ? 0.3 : 0 }}
          >
            <svg
              width="80"
              height="120"
              viewBox="0 0 24 36"
              fill="#ffffff"
              className="relative overflow-visible"
            >
              <circle cx="12" cy="10" r="9" />
              <path d="M8 16 L4 32 C 3 35, 21 35, 20 32 L16 16 Z" />
            </svg>
          </m.div>

          {screenState === 'idle' && (
            <m.p
              className="absolute -bottom-24 whitespace-nowrap text-sm font-medium uppercase tracking-[0.4em] text-white/90"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.8,
                duration: 1,
                ease: 'easeOut',
              }}
            >
              Click to Start
            </m.p>
          )}
        </m.div>
      </m.div>
    </m.div>
  );
};

export default StartScreen;
