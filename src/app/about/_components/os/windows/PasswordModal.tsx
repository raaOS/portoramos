"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Loader2 } from 'lucide-react';

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
    const inputRefs = React.useMemo(() => [React.createRef<HTMLInputElement>(), React.createRef<HTMLInputElement>(), React.createRef<HTMLInputElement>(), React.createRef<HTMLInputElement>()], []);

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
        React.startTransition(() => {
            setMounted(true);
        });
    }, []);

    useEffect(() => {
        if (isOpen) {
            void fetch('/api/os/verify-password', {
                method: 'GET',
                credentials: 'include'
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

        if (newPin.every(digit => digit !== '')) {
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
                    'x-csrf-token': csrfToken
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
                <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4">
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
                            x: error ? [0, -10, 10, -10, 10, 0] : 0
                        }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{
                            x: error ? { duration: 0.4, ease: "easeInOut" } : { type: "spring", damping: 20, stiffness: 300 }
                        }}
                        className="relative w-[320px] bg-gray-900 border border-white/10 rounded-[32px] p-8 flex flex-col items-center gap-6 overflow-hidden mt-[-10vh]"
                    >
                        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                        <div className="space-y-4 text-center relative z-10 w-full">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto">
                                <Lock size={20} className={error ? "text-red-400" : "text-white/80"} />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold text-white">Enter PIN</h2>
                                <p className="text-sm text-white/50">To unlock editing mode</p>
                            </div>
                        </div>

                        <div className="flex gap-2 relative z-10">
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
                                    className={`w-12 h-14 bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/20'} rounded-2xl text-center text-2xl font-bold text-white focus:outline-none focus:border-white/50 transition-all`}
                                />
                            ))}
                        </div>

                        <div className="relative z-10 w-full mt-2">
                            {isVerifying ? (
                                <div className="flex items-center justify-center gap-2 text-white/50 text-xs font-medium uppercase tracking-tighter">
                                    <Loader2 size={16} className="animate-spin" />
                                    Verifying...
                                </div>
                            ) : error ? (
                                <div className="text-center">
                                    <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">Incorrect PIN</span>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <button
                                        onClick={onClose}
                                        className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors"
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
