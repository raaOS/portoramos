'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Star, X, Heart, Send } from 'lucide-react';
import { useExitIntent } from '@/hooks/useExitIntent';
import { useToast } from '@/contexts/ToastContext';
import { Z_LAYERS } from '../utils/zIndexLayers';

/**
 * Exit-Intent Feedback Modal
 *
 * Muncul sekali per session saat kursor visitor bergerak keluar viewport ke atas
 * (sinyal "mau nutup tab"). Ngajakin visitor ninggalin rating + pesan singkat.
 *
 * Throttling (mode sopan):
 * - Session flag `ramos_exit_feedback_shown` → modal tidak muncul 2x di session
 *   yang sama (satu tab, sampai ditutup).
 * - Session flag `ramos_exit_feedback_sent`  → setelah sukses submit, modal
 *   langsung disable sampai user buka tab baru.
 * - Engagement minimum 15 detik → modal nggak nongol pas visitor baru nyampe.
 *
 * Layer pertahanan lapis kedua tetap di server: rate-limit per IP + dedup per
 * clientId (1 jam window).
 */

const SESSION_SHOWN_KEY = 'ramos_exit_feedback_shown';
const SESSION_SENT_KEY = 'ramos_exit_feedback_sent';
// localStorage — stable client identifier supaya server bisa dedup lintas
// session (berbeda dari sessionStorage flag yang reset tiap tab baru).
const CLIENT_ID_KEY = 'ramos_client_id';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Baca session flags sekali di client. Server selalu return true (enabled)
 * supaya hydration konsisten; hook `useExitIntent` no-op di server jadi
 * perbedaan nilai awal aman.
 */
function readEnabledFromSession(): boolean {
    if (typeof window === 'undefined') return true;
    try {
        const shown = sessionStorage.getItem(SESSION_SHOWN_KEY) === '1';
        const sent = sessionStorage.getItem(SESSION_SENT_KEY) === '1';
        return !shown && !sent;
    } catch {
        return true;
    }
}

/**
 * Generate or load stable clientId dari localStorage. Dipakai server untuk
 * dedup per-client tanpa perlu auth. Bukan fingerprint — cukup random UUID.
 */
function getOrCreateClientId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const existing = localStorage.getItem(CLIENT_ID_KEY);
        if (existing && existing.length >= 8) return existing;
        // crypto.randomUUID tersedia di semua browser target (Chrome 92+, FF 95+, Safari 15.4+)
        const fresh = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
            ? crypto.randomUUID()
            : `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(CLIENT_ID_KEY, fresh);
        return fresh;
    } catch {
        return null;
    }
}

function detectDevice(): 'desktop' | 'tablet' | 'mobile' | null {
    if (typeof window === 'undefined') return null;
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

export default function ExitIntentFeedback() {
    const prefersReducedMotion = useReducedMotion();
    const toast = useToast();

    // Lazy init dari sessionStorage — ini client-only component (mounted via
    // next/dynamic with ssr:false) jadi aman akses sessionStorage langsung.
    const [enabled] = useState<boolean>(readEnabledFromSession);

    const triggered = useExitIntent({ enabled, minEngagementMs: 15_000 });

    const [isOpen, setIsOpen] = useState(false);
    const hasOpenedForTriggerRef = useRef(false);

    useEffect(() => {
        if (!triggered || hasOpenedForTriggerRef.current) return;
        hasOpenedForTriggerRef.current = true;
        setIsOpen(true);
        try {
            sessionStorage.setItem(SESSION_SHOWN_KEY, '1');
        } catch { /* ignore */ }
    }, [triggered]);

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [message, setMessage] = useState('');
    const [name, setName] = useState('');
    const [honeypot, setHoneypot] = useState(''); // Harus kosong
    const [submitState, setSubmitState] = useState<SubmitState>('idle');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Timestamp modal dibuka — dipakai server untuk minimum-fill-time check.
    // Pakai ref (bukan state) supaya nggak trigger cascading render, dan di-set
    // di dalam useEffect supaya impure call Date.now() nggak run di render phase.
    const formOpenedAtRef = useRef<number | null>(null);
    useEffect(() => {
        if (isOpen) {
            formOpenedAtRef.current = Date.now();
        } else {
            formOpenedAtRef.current = null;
        }
    }, [isOpen]);

    // ESC untuk tutup
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    const handleClose = () => {
        setIsOpen(false);
        // Reset state kalau sukses (biar kalau dibuka lagi form kosong),
        // kalau idle biarin saja supaya draft-nya kejaga kalau user buka lagi.
        if (submitState === 'success') {
            setRating(0);
            setMessage('');
            setName('');
            setSubmitState('idle');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitState === 'submitting') return;
        if (rating === 0) {
            toast.showWarning('Kasih bintang dulu ya', 2500);
            return;
        }

        setSubmitState('submitting');

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating,
                    message: message.trim() || undefined,
                    name: name.trim() || undefined,
                    fromPath: typeof window !== 'undefined' ? window.location.pathname : undefined,
                    clientId: getOrCreateClientId() ?? undefined,
                    device: detectDevice() ?? undefined,
                    formOpenedAt: formOpenedAtRef.current ?? undefined,
                    source: 'exit-intent' as const,
                    website_url: honeypot || undefined,
                }),
            });

            if (!res.ok) {
                if (res.status === 429) {
                    toast.showError('Kamu baru aja kirim feedback. Coba lagi nanti ya.', 4000);
                } else {
                    toast.showError('Gagal kirim feedback. Coba lagi sebentar.', 4000);
                }
                setSubmitState('error');
                return;
            }

            try {
                sessionStorage.setItem(SESSION_SENT_KEY, '1');
            } catch { /* ignore */ }

            setSubmitState('success');
            toast.showSuccess('Terima kasih atas feedbacknya! 🙏', 3500);
        } catch (err) {
            console.error('[ExitIntentFeedback] submit error', err);
            toast.showError('Gagal terhubung. Coba lagi nanti.', 4000);
            setSubmitState('error');
        }
    };

    // SSR-safe portal target — client-only via useSyncExternalStore mount guard.
    // Menghindari direct setState di useEffect (react-hooks/set-state-in-effect).
    const isClient = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
    const portalTarget = isClient ? document.body : null;

    if (!portalTarget) return null;

    const scaleIn = prefersReducedMotion
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : {
              initial: { opacity: 0, scale: 0.92, y: 10 },
              animate: { opacity: 1, scale: 1, y: 0 },
              exit: { opacity: 0, scale: 0.95, y: 10 },
          };

    const springTransition = prefersReducedMotion
        ? { duration: 0.18 }
        : { type: 'spring' as const, stiffness: 320, damping: 26 };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center p-4"
                    style={{ zIndex: Z_LAYERS.CRITICAL_MODAL }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="exit-feedback-title"
                        className="relative w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-black/5"
                        {...scaleIn}
                        transition={springTransition}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors z-10"
                            aria-label="Tutup"
                        >
                            <X size={18} />
                        </button>

                        {submitState === 'success' ? (
                            <SuccessView onClose={handleClose} />
                        ) : (
                            <form onSubmit={handleSubmit} className="px-6 pt-6 pb-5">
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 mb-3">
                                        <Heart size={22} className="text-orange-500" fill="currentColor" />
                                    </div>
                                    <h2 id="exit-feedback-title" className="text-lg font-semibold text-gray-900">
                                        Eh, sebelum pergi...
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                                        Boleh minta kesan kamu tentang portfolio ini? Satu menit aja.
                                    </p>
                                </div>

                                {/* Rating */}
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    {[1, 2, 3, 4, 5].map((n) => {
                                        const active = n <= (hoverRating || rating);
                                        return (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setRating(n)}
                                                onMouseEnter={() => setHoverRating(n)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                aria-label={`${n} bintang`}
                                                className="p-1 transition-transform active:scale-90"
                                            >
                                                <Star
                                                    size={30}
                                                    className={active ? 'text-amber-400' : 'text-gray-200'}
                                                    fill={active ? 'currentColor' : 'none'}
                                                    strokeWidth={active ? 0 : 1.5}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Nama (opsional) */}
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Nama <span className="text-gray-400">(opsional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={50}
                                    placeholder="Anonim juga nggak papa"
                                    className="w-full mb-3 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-0 outline-none transition-colors"
                                    disabled={submitState === 'submitting'}
                                />

                                {/* Pesan (opsional) */}
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                    Saran / kritik <span className="text-gray-400">(opsional)</span>
                                </label>
                                <textarea
                                    ref={textareaRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                    placeholder="Apa yang kamu suka atau belum pas..."
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-0 outline-none resize-none transition-colors"
                                    disabled={submitState === 'submitting'}
                                />
                                <div className="text-right text-[10px] text-gray-400 mt-0.5">
                                    {message.length}/500
                                </div>

                                {/* Honeypot (hidden) */}
                                <input
                                    type="text"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={honeypot}
                                    onChange={(e) => setHoneypot(e.target.value)}
                                    aria-hidden="true"
                                    className="absolute w-px h-px p-0 m-[-1px] overflow-hidden whitespace-nowrap border-0"
                                    style={{ clip: 'rect(0, 0, 0, 0)' }}
                                />

                                {/* Actions */}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                        disabled={submitState === 'submitting'}
                                    >
                                        Nggak dulu
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitState === 'submitting' || rating === 0}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {submitState === 'submitting' ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Kirim...
                                            </span>
                                        ) : (
                                            <>
                                                <Send size={14} />
                                                Kirim feedback
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        portalTarget
    );
}

function SuccessView({ onClose }: { onClose: () => void }) {
    return (
        <div className="px-6 pt-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 mb-3">
                <Heart size={26} className="text-emerald-600" fill="currentColor" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Makasih banyak!
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
                Feedback kamu udah sampai. Sampai jumpa lagi.
            </p>
            <button
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
                Tutup
            </button>
        </div>
    );
}
