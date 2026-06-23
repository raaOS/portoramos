import type { Transition } from 'motion/react';

export const relaxedEase = [0.22, 1, 0.36, 1] as const;

export const closedPopoverWidth = 46;

export const slideVariants = {
  enter: (direction: number) => ({
    y: direction > 0 ? 160 : -160,
    scale: 0.9,
    opacity: 0,
    rotateX: direction > 0 ? 12 : -12,
  }),
  center: {
    y: 0,
    scale: 1,
    opacity: 1,
    rotateX: 0,
    zIndex: 10,
  },
  exit: (direction: number) => ({
    y: direction > 0 ? -160 : 160,
    scale: 0.85,
    opacity: 0,
    rotateX: direction > 0 ? -12 : 12,
    zIndex: 0,
  }),
};

export const getPopoverTransition = (prefersReducedMotion: boolean): Transition => (
  prefersReducedMotion
    ? { duration: 0.14, ease: relaxedEase }
    : {
        type: 'spring' as const,
        stiffness: 340,
        damping: 32,
        mass: 0.8,
        opacity: { duration: 0.14 },
        filter: { duration: 0.16 },
        width: { type: 'spring' as const, stiffness: 430, damping: 34, mass: 0.85 },
        height: { type: 'spring' as const, stiffness: 320, damping: 34, mass: 0.9 },
      }
);

export const getPopoverExitTransition = (prefersReducedMotion: boolean): Transition => (
  prefersReducedMotion
    ? { duration: 0.12, ease: relaxedEase }
    : {
        type: 'spring' as const,
        stiffness: 380,
        damping: 34,
        mass: 0.85,
        opacity: { duration: 0.16 },
        filter: { duration: 0.16 },
        width: { type: 'spring' as const, stiffness: 450, damping: 36, mass: 0.85 },
      }
);

export const getPopoverContentVariants = (prefersReducedMotion: boolean) => ({
  initial: {
    opacity: 0,
    x: prefersReducedMotion ? 0 : 8,
    filter: prefersReducedMotion ? 'blur(0px)' : 'blur(2px)',
  },
  animate: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.16, ease: relaxedEase },
  },
  exit: {
    opacity: 0,
    x: prefersReducedMotion ? 0 : 8,
    filter: prefersReducedMotion ? 'blur(0px)' : 'blur(2px)',
    transition: { duration: 0.14, ease: relaxedEase },
  },
});
