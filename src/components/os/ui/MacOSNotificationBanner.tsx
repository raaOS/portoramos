'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTransitionRouter } from 'next-view-transitions';
import { Sparkles, X, Grid, Box } from 'lucide-react';
import { soundManager } from '../utils/SoundManager';

const SESSION_KEY = 'dismissed_views_notification_v1';
const AUTO_DISMISS_DELAY_MS = 10000;
const INITIAL_APPEAR_DELAY_MS = 2400;

interface MacOSNotificationBannerProps {
  isReady?: boolean;
}

export function MacOSNotificationBanner({ isReady = true }: MacOSNotificationBannerProps) {
  const router = useTransitionRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isReady) return;

    // Check if already dismissed in this session
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) {
        return;
      }
    } catch {
      // Ignore sessionStorage access error
    }

    const appearTimer = setTimeout(() => {
      setIsVisible(true);
      soundManager.play('notification');
    }, INITIAL_APPEAR_DELAY_MS);

    return () => clearTimeout(appearTimer);
  }, [isReady]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, 'true');
      }
    } catch {
      // Ignore sessionStorage access error
    }
  }, []);

  // Auto-dismiss countdown (pauses on hover)
  useEffect(() => {
    if (!isVisible || isHovered) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, AUTO_DISMISS_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, isHovered, handleDismiss]);

  const handleNavigate = useCallback(
    (view: '3d' | 'grid') => {
      handleDismiss();
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-vt-direction');
      }
      router.push(`/projects?view=${view}`);
    },
    [handleDismiss, router]
  );

  return (
    <aside aria-label="Notifikasi Mode Tampilan" className="pointer-events-none fixed right-4 top-10 z-[9999] select-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.94, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{
              opacity: 0,
              x: 80,
              scale: 0.94,
              filter: 'blur(6px)',
              transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
            }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 28,
              mass: 0.75,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="pointer-events-auto relative w-[340px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-white/40 bg-white/75 p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.16)] backdrop-blur-2xl transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(0,0,0,0.22)] dark:border-white/15 dark:bg-neutral-900/80 dark:shadow-[0_16px_44px_rgba(0,0,0,0.55)]"
          >
            {/* Header / App Info */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 shadow-sm">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Portfolio Explorer
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">now</span>
                <button
                  onClick={handleDismiss}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Tutup notifikasi"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="mt-2 pl-0.5">
              <h4 className="text-[12.5px] font-semibold tracking-tight text-neutral-900 dark:text-white">
                Tersedia Mode 3D Canvas & Grid
              </h4>
              <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                Jelajahi portofolio dalam mode <b>3D Spatial Canvas</b> interaktif atau <b>Pinterest Grid</b>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => handleNavigate('3d')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11.5px] font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-500 active:scale-[0.97]"
              >
                <Box className="h-3.5 w-3.5" />
                <span>3D Canvas</span>
              </button>
              <button
                onClick={() => handleNavigate('grid')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/5 bg-black/5 px-2.5 py-1.5 text-[11.5px] font-medium text-neutral-800 transition-all duration-150 hover:bg-black/10 active:scale-[0.97] dark:border-white/10 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/15"
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Grid View</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
