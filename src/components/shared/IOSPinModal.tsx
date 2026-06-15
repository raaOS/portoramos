'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock } from 'lucide-react';
import { soundManager } from '@/components/os/utils/SoundManager';

interface IOSPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const KEYPAD_DATA = [
  { num: '1', letters: '' },
  { num: '2', letters: 'A B C' },
  { num: '3', letters: 'D E F' },
  { num: '4', letters: 'G H I' },
  { num: '5', letters: 'J K L' },
  { num: '6', letters: 'M N O' },
  { num: '7', letters: 'P Q R S' },
  { num: '8', letters: 'T U V' },
  { num: '9', letters: 'W X Y Z' },
];

export default function IOSPinModal({ isOpen, onClose, onSuccess }: IOSPinModalProps) {
  const [enteredPin, setEnteredPin] = useState('');
  const [shake, setShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const pinLength = 4;

  const handleNumberPress = useCallback(
    async (num: string) => {
      if (enteredPin.length >= pinLength || isSuccess || shake) return;

      // Unlock and play tap sound
      soundManager.init();
      soundManager.play('click');

      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);

      if (nextPin.length === pinLength) {
        try {
          const res = await fetch('/api/admin/pin/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pin: nextPin }),
          });
          const data = await res.json();

          if (res.ok && data.success) {
            setIsSuccess(true);
            soundManager.play('unlock');
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1200); // 1.2s delay to show checkmark animation
          } else {
            soundManager.play('error');
            setShake(true);
            setTimeout(() => {
              setEnteredPin('');
            }, 500);
          }
        } catch (error) {
          console.error('[Pin Modal] Verification error:', error);
          soundManager.play('error');
          setShake(true);
          setTimeout(() => {
            setEnteredPin('');
          }, 500);
        }
      }
    },
    [enteredPin, pinLength, isSuccess, shake, onSuccess, onClose]
  );

  const handleDelete = useCallback(() => {
    if (enteredPin.length === 0 || isSuccess || shake) return;
    soundManager.init();
    soundManager.play('click');
    setEnteredPin((prev) => prev.slice(0, -1));
  }, [enteredPin, isSuccess, shake]);

  // Reset state after modal closes to prevent layout flash during exit animation
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setEnteredPin('');
        setIsSuccess(false);
        setShake(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Support physical keyboard
  useEffect(() => {
    if (!isOpen || isSuccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumberPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, enteredPin, isSuccess, handleNumberPress, handleDelete, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[11000] flex select-none flex-col items-center justify-center bg-black/60 text-white backdrop-blur-xl"
        >
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="passcode-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center"
              >
                {/* iOS Passcode Header */}
                <div className="mb-8 flex flex-col items-center px-6 text-center">
                  <Lock size={26} className="mb-4 text-white/90" />
                  <h2 className="text-base font-normal tracking-wide text-white/95">
                    Masukkan PIN
                  </h2>
                  <p className="mt-1.5 text-[11px] font-normal text-white/40">
                    PIN diperlukan untuk membuka halaman login admin
                  </p>
                </div>

                {/* Passcode Indicator Circles */}
                <motion.div
                  animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  onAnimationComplete={() => setShake(false)}
                  className="mb-10 flex justify-center gap-4"
                >
                  {Array.from({ length: pinLength }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3.5 w-3.5 rounded-full border border-white/30 transition-all duration-150 ${
                        i < enteredPin.length
                          ? 'scale-110 border-white bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </motion.div>

                {/* iOS circular number keypad */}
                <div className="mb-6 grid w-full max-w-[280px] grid-cols-3 justify-items-center gap-x-6 gap-y-4">
                  {KEYPAD_DATA.map((key) => (
                    <button
                      key={key.num}
                      onClick={() => handleNumberPress(key.num)}
                      className="w-18 h-18 flex cursor-pointer select-none flex-col items-center justify-center rounded-full border border-white/10 bg-white/5 outline-none transition-all duration-100 active:scale-95 active:bg-white/20 sm:h-20 sm:w-20"
                    >
                      <span className="pt-1 text-3xl font-light leading-none">{key.num}</span>
                      {key.letters && (
                        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-widest text-white/50">
                          {key.letters}
                        </span>
                      )}
                    </button>
                  ))}

                  {/* Bottom Row */}
                  {/* Cancel Button (Batal) */}
                  <button
                    onClick={onClose}
                    className="w-18 h-18 flex cursor-pointer select-none items-center justify-center text-sm font-normal text-white/80 outline-none transition-colors active:text-white sm:h-20 sm:w-20"
                  >
                    Batal
                  </button>

                  {/* 0 Button */}
                  <button
                    onClick={() => handleNumberPress('0')}
                    className="w-18 h-18 flex cursor-pointer select-none flex-col items-center justify-center rounded-full border border-white/10 bg-white/5 outline-none transition-all duration-100 active:scale-95 active:bg-white/20 sm:h-20 sm:w-20"
                  >
                    <span className="text-3xl font-light leading-none">{0}</span>
                  </button>

                  {/* Delete Button (Hapus) */}
                  <button
                    onClick={handleDelete}
                    disabled={enteredPin.length === 0}
                    className="w-18 h-18 flex cursor-pointer select-none items-center justify-center text-sm font-normal text-white/80 outline-none transition-colors active:text-white disabled:pointer-events-none disabled:opacity-0 sm:h-20 sm:w-20"
                  >
                    Hapus
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-checkmark"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="animate-in fade-in zoom-in flex flex-col items-center justify-center duration-300"
              >
                <div className="relative flex h-28 w-28 items-center justify-center">
                  {/* Ripple Circle effect */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 1.0, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-emerald-500/30"
                  />
                  {/* Main Green Circle */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                    <svg
                      className="h-10 w-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 text-sm font-semibold tracking-wide text-emerald-400"
                >
                  PIN Benar, Membuka Login
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
