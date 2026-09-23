import type { Variants } from 'motion/react';

export const desktopContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

export const desktopItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.4,
    y: 20,
  },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 450,
      damping: 12,
      mass: 1,
      opacity: { duration: 0.1 },
    },
  },
};
