import React, { useState, useEffect, useRef, useCallback } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

import { ContactProfile } from '../data/mockChats';
import { getAvatarUrl } from '@/lib/avatar';
import { useUnifiedZIndex } from '../context/UnifiedZIndexContext';

interface DynamicIslandProps {
  isBooting: boolean;
  onOpenChat?: (chatId?: string) => void;
  customNotifications?: ContactProfile[];
  islandId?: string;
}

interface IslandNotification {
  id: string;
  chatId: string;
  name: string;
  message: string;
  avatar: string;
  initial: string;
}

const ISLAND_ID = 'dynamic-island';

// Interval cycling: cepat di awal supaya visitor langsung notice,
// melambat setelah satu putaran penuh agar tidak spam.
const FIRST_CYCLE_INTERVAL_MS = 8000;
const STEADY_CYCLE_INTERVAL_MS = 20000;
const NOTIFICATION_DISPLAY_MS = 6000;
const INITIAL_DELAY_MS = 1000;

const DynamicIsland = ({
  isBooting,
  onOpenChat,
  customNotifications,
  islandId = ISLAND_ID,
}: DynamicIslandProps) => {
  const prefersReducedMotion = useReducedMotion();
  const { bringToFront, getZIndex } = useUnifiedZIndex();
  const [notification, setNotification] = useState<IslandNotification | null>(null);
  const [fullMessage, setFullMessage] = useState('');
  const [visibleChars, setVisibleChars] = useState(0);
  const [showVerified, setShowVerified] = useState(false);
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textToggleRef = useRef<NodeJS.Timeout | null>(null);
  const currentIndexRef = useRef(0);
  const hasCompletedFirstCycleRef = useRef(false);

  // Handle focus - bring island to front in unified z-index system
  const handleFocus = useCallback(() => {
    bringToFront(islandId, 'dynamicIsland');
  }, [bringToFront, islandId]);

  // Register with unified z-index system on mount
  useEffect(() => {
    handleFocus();
  }, [handleFocus]);

  // Typing effect for message — skipped when reduced-motion is preferred.
  const startTypingEffect = useCallback(
    (message: string) => {
      const safeMessage = typeof message === 'string' ? message : String(message || '');
      const shortMessage =
        safeMessage.length > 22 ? safeMessage.substring(0, 22) + '...' : safeMessage;
      setFullMessage(shortMessage);

      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

      if (prefersReducedMotion) {
        setVisibleChars(shortMessage.length);
        return;
      }

      setVisibleChars(0);
      let index = 0;
      typingIntervalRef.current = setInterval(() => {
        if (index < shortMessage.length) {
          setVisibleChars(index + 1);
          index++;
        } else {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        }
      }, 30);
    },
    [prefersReducedMotion]
  );

  // Toggle between name and verified text — reduced to single static switch
  // when reduced-motion is preferred.
  const startTextToggle = useCallback(() => {
    if (textToggleRef.current) {
      clearInterval(textToggleRef.current);
      clearTimeout(textToggleRef.current);
    }

    setShowVerified(false);

    if (prefersReducedMotion) {
      textToggleRef.current = setTimeout(() => {
        setShowVerified(true);
      }, 1200) as unknown as NodeJS.Timeout;
      return;
    }

    let toggleCount = 0;
    textToggleRef.current = setInterval(() => {
      toggleCount++;
      setShowVerified((prev) => !prev);
      if (toggleCount >= 5) {
        if (textToggleRef.current) clearInterval(textToggleRef.current);
      }
    }, 2000);
  }, [prefersReducedMotion]);

  const triggerNotification = useCallback(
    (index?: number) => {
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (textToggleRef.current) {
        clearInterval(textToggleRef.current);
        clearTimeout(textToggleRef.current);
      }

      let randomTesti;

      if (customNotifications && customNotifications.length > 0) {
        const actualIndex =
          index !== undefined ? index : Math.floor(Math.random() * customNotifications.length);
        const randomContact = customNotifications[actualIndex];

        const isGenericStatus =
          !randomContact.status ||
          ['Online', 'Terakhir dilihat', 'Akun Bisnis'].some((s) =>
            randomContact.status?.includes(s)
          );

        const notificationMsg =
          !isGenericStatus && randomContact.status
            ? randomContact.status
            : randomContact.conversation && randomContact.conversation.length > 0
              ? randomContact.conversation[randomContact.conversation.length - 1].text
              : 'Mengirim pesan...';

        const initial = randomContact.name.charAt(0).toUpperCase();

        randomTesti = {
          id: `notif-${Date.now()}`,
          chatId: randomContact.id,
          name: randomContact.name,
          message: notificationMsg,
          avatar:
            randomContact.avatar && randomContact.avatar.startsWith('http')
              ? randomContact.avatar
              : getAvatarUrl(randomContact.name),
          initial,
        };
      }

      if (randomTesti) {
        handleFocus();
        setNotification(randomTesti);
        startTypingEffect(randomTesti.message);
        startTextToggle();

        notificationTimerRef.current = setTimeout(() => {
          setNotification(null);
          setFullMessage('');
          setVisibleChars(0);
          setShowVerified(false);
          notificationTimerRef.current = null;
        }, NOTIFICATION_DISPLAY_MS);
      }
    },
    [customNotifications, handleFocus, startTypingEffect, startTextToggle]
  );

  useEffect(() => {
    if (isBooting) return;
    if (!customNotifications || customNotifications.length === 0) return;

    let interval: NodeJS.Timeout | null = null;

    const scheduleNext = () => {
      const delay = hasCompletedFirstCycleRef.current
        ? STEADY_CYCLE_INTERVAL_MS
        : FIRST_CYCLE_INTERVAL_MS;
      interval = setTimeout(() => {
        currentIndexRef.current = (currentIndexRef.current + 1) % customNotifications.length;
        if (currentIndexRef.current === 0) {
          hasCompletedFirstCycleRef.current = true;
        }
        triggerNotification(currentIndexRef.current);
        scheduleNext();
      }, delay);
    };

    const initialDelay = setTimeout(() => {
      triggerNotification(currentIndexRef.current);
      scheduleNext();
    }, INITIAL_DELAY_MS);

    return () => {
      clearTimeout(initialDelay);
      if (interval) clearTimeout(interval);
      if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (textToggleRef.current) {
        clearInterval(textToggleRef.current);
        clearTimeout(textToggleRef.current);
      }
      setNotification(null);
      setFullMessage('');
      setVisibleChars(0);
      setShowVerified(false);
    };
  }, [isBooting, customNotifications, triggerNotification]);

  const currentState: 'idle' | 'notification' = notification ? 'notification' : 'idle';

  const variants = {
    idle: {
      width: 90,
      height: 32,
      borderRadius: 9999,
    },
    notification: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
    },
  };

  if (isBooting) return null;

  const zIndex = getZIndex(islandId);

  const islandTransition = prefersReducedMotion
    ? { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }
    : {
        type: 'spring' as const,
        stiffness: 400,
        damping: 28,
        layout: { duration: 0.3 },
      };

  const avatarBounceAnimation = prefersReducedMotion
    ? { y: 0, scaleX: 1, scaleY: 1 }
    : {
        y: [0, -2, 0],
        scaleY: [1, 1.06, 0.97, 1],
        scaleX: [1, 0.97, 1.02, 1],
      };

  const avatarBounceTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 3,
        ease: [0.34, 1.56, 0.64, 1] as const,
        times: [0, 0.4, 0.7, 1],
      };

  return (
    <div
      data-testid="dynamic-island"
      className="pointer-events-none fixed left-0 right-0 top-[42px] flex justify-center print:hidden"
      style={{ zIndex }}
    >
      <div className="pointer-events-none relative flex h-12 w-[min(220px,92vw)] items-center justify-center">
        <m.div
          onMouseDown={handleFocus}
          onPointerDown={handleFocus}
          className="pointer-events-auto shrink-0 origin-center cursor-default overflow-hidden border border-white/10 bg-black"
          initial="idle"
          animate={currentState}
          variants={variants}
          transition={islandTransition}
        >
          <div className="relative flex h-full w-full items-center px-5 text-white">
            {/* Idle State - minimal "pill" */}
            {currentState === 'idle' && null}

            {/* Notification State (WhatsApp-style testimonial) */}
            {currentState === 'notification' && notification && (
              <m.div
                className="flex h-full w-full cursor-pointer items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
                  if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
                  if (textToggleRef.current) {
                    clearInterval(textToggleRef.current);
                    clearTimeout(textToggleRef.current);
                  }
                  setNotification(null);
                  setFullMessage('');
                  setVisibleChars(0);
                  setShowVerified(false);
                  onOpenChat?.(notification.chatId);
                }}
              >
                {/* Avatar with Elastic Bounce (skipped under reduced-motion) */}
                <m.div
                  className="relative flex h-7 w-7 shrink-0 items-center justify-center"
                  animate={avatarBounceAnimation}
                  transition={avatarBounceTransition}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-xs font-bold text-white">
                    {notification.initial}
                  </div>
                </m.div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  {/* Name / Verified Row */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative h-4 flex-1 overflow-hidden">
                      {/* Name */}
                      <m.span
                        animate={{
                          y: showVerified ? -16 : 0,
                          opacity: showVerified ? 0 : 1,
                        }}
                        transition={{
                          duration: prefersReducedMotion ? 0.1 : 0.25,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-0 flex items-center truncate text-[12px] font-semibold leading-none text-white"
                      >
                        {notification.name}
                      </m.span>
                      {/* Verified */}
                      <m.span
                        animate={{
                          y: showVerified ? 0 : 16,
                          opacity: showVerified ? 1 : 0,
                        }}
                        transition={{
                          duration: prefersReducedMotion ? 0.1 : 0.25,
                          ease: 'easeInOut',
                        }}
                        className="absolute inset-0 inline-flex items-center gap-1 text-[10px] font-medium leading-none text-green-400"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Verified Testimonial
                      </m.span>
                    </div>
                  </div>

                  {/* Testimonial Quote */}
                  <p className="mt-0.5 flex items-center gap-[1px] overflow-hidden text-[10px] leading-tight text-gray-400">
                    <span aria-hidden="true">&ldquo;</span>
                    <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap">
                      {fullMessage.slice(0, visibleChars)}
                    </span>
                    <span aria-hidden="true">&rdquo;</span>
                  </p>
                </div>
              </m.div>
            )}
          </div>
        </m.div>
      </div>
    </div>
  );
};

export default DynamicIsland;
export { ISLAND_ID };
