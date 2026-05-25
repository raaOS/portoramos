'use client';

import React, { useState, useEffect, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Loader2 } from 'lucide-react';
import { Z_LAYERS } from '../utils/zIndexLayers';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordModal({ isOpen, onClose, onSuccess }: PasswordModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  const inputRefs = React.useMemo(
    () => [
      React.createRef<HTMLInputElement>(),
      React.createRef<HTMLInputElement>(),
      React.createRef<HTMLInputElement>(),
      React.createRef<HTMLInputElement>(),
    ],
    []
  );

  const [mounted, setMounted] = useState(false);

  // Re-sync state during render phase for purity
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setPin(['', '', '', '']);
      setError(false);
    }
  }

  useEffect(() => {
    startTransition(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetch('/api/os/verify-password', {
        method: 'GET',
        credentials: 'include',
      })
        .then(async (response) => {
          const data = await response.json().catch(() => null);
          if (data?.csrfToken) {
            setCsrfToken(data.csrfToken);
          }
        })
        .catch((fetchError) => {
          console.error('Failed to initialize password verification', fetchError);
        });

      const timer = setTimeout(() => {
        const firstInput = inputRefs[0].current;
        if (firstInput) firstInput.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, inputRefs]);

  const handlePinChange = async (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (newPin.every((digit) => digit !== '')) {
      const finalPin = newPin.join('');
      verifyPin(finalPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const verifyPin = async (finalPin: string) => {
    setIsVerifying(true);
    setError(false);

    try {
      const response = await fetch('/api/os/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ password: finalPin }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        setPin(['', '', '', '']);
      } else {
        setError(true);
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    } catch (err) {
      console.error('Verification failed', err);
      setError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: Z_LAYERS.CRITICAL_MODAL }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              x: error ? [0, -10, 10, -10, 10, 0] : 0,
            }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{
              x: error
                ? { duration: 0.4, ease: 'easeInOut' }
                : { type: 'spring', damping: 20, stiffness: 300 },
            }}
            className="relative mt-[-10vh] flex w-[320px] flex-col items-center gap-6 overflow-hidden rounded-[32px] border border-white/10 bg-gray-900 p-8"
          >
            <div className="pointer-events-none absolute left-0 right-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />

            <div className="relative z-10 w-full space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                <Lock size={20} className={error ? 'text-red-400' : 'text-white/80'} />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-white">Enter PIN</h2>
                <p className="text-sm text-white/50">To unlock editing mode</p>
              </div>
            </div>

            <div className="relative z-10 flex gap-2">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={isVerifying}
                  className={`h-14 w-12 border bg-white/5 ${error ? 'border-red-500/50' : 'border-white/20'} rounded-2xl text-center text-2xl font-bold text-white transition-all focus:border-white/50 focus:outline-none`}
                />
              ))}
            </div>

            <div className="relative z-10 mt-2 w-full">
              {isVerifying ? (
                <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-tighter text-white/50">
                  <Loader2 size={16} className="animate-spin" />
                  Verifying...
                </div>
              ) : error ? (
                <div className="text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    Incorrect PIN
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={onClose}
                    className="text-xs font-medium text-white/30 transition-colors hover:text-white/60"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
