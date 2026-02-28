"use client";

import React, { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { soundManager } from "../utils/SoundManager";
import "./retro/retro-os.css";

// Sad Mac SVG - Pixelated Style
const SadMacIcon = () => (
    <svg width="60" height="60" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="pixelated">
        <rect width="40" height="40" fill="black" />
        <rect x="2" y="2" width="36" height="30" fill="white" />
        <rect x="2" y="34" width="36" height="4" fill="white" />
        {/* Screen Area */}
        <rect x="6" y="6" width="28" height="20" fill="white" stroke="black" strokeWidth="2" />
        {/* Sad Face */}
        <rect x="12" y="12" width="2" height="2" fill="black" />
        <rect x="26" y="12" width="2" height="2" fill="black" />
        <path d="M14 22C14 22 16 19 20 19C24 19 26 22 26 22" stroke="black" strokeWidth="2" />
        {/* Small details */}
        <rect x="32" y="35" width="2" height="2" fill="black" />
    </svg>
);

export default function RetroMobileOverlay() {
    const [step, setStep] = useState<"boot" | "error" | "details">("boot");
    const [progress, setProgress] = useState(0);
    const [locale] = useState<"id" | "en">(() => {
        // Safe check for locale during initialization if possible
        if (typeof Intl !== 'undefined') {
            try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const indonesianTz = ["Asia/Jakarta", "Asia/Pontianak", "Asia/Makassar", "Asia/Jayapura"];
                if (indonesianTz.includes(tz)) return "id";
            } catch { }
        }
        return "en";
    });
    const [copied, setCopied] = useState(false);
    const [siteUrl] = useState(() => {
        if (typeof window !== 'undefined') return window.location.origin;
        return "";
    });

    // Sound effect on error
    useEffect(() => {
        if (step === "error") {
            soundManager.play('error');
        }
    }, [step]);

    // Initial interaction listener for mobile as well
    useEffect(() => {
        const initAudio = () => {
            soundManager.init();
            window.removeEventListener('touchstart', initAudio);
            window.removeEventListener('mousedown', initAudio);
        };
        window.addEventListener('touchstart', initAudio);
        window.addEventListener('mousedown', initAudio);
        return () => {
            window.removeEventListener('touchstart', initAudio);
            window.removeEventListener('mousedown', initAudio);
        };
    }, []);


    // Locale is now initialized in useState to avoid cascading render

    const t = {
        id: {
            boot: "Memuat Macintosh OS...",
            title: "Akses Terbatas",
            errorTitle: "Smartphone tidak cocok untuk pengalaman ini.",
            errorMessage: "Portfolio ini merupakan simulasi Desktop OS utuh yang memerlukan layar lebar. Smartphone Anda tidak memiliki cukup 'Creative RAM' untuk merendernya.",
            errorCode: "Peringatan: HARAP GUNAKAN LAPTOP/PC",
            restartBtn: "Buka di Desktop",
            loadingTrans: "Menyiapkan tautan sinkronisasi...",
            qrInstruction: "Pindai disket ini untuk pindah ke Desktop.",
            backBtn: "Kembali ke Beranda",
            copyBtn: "Salin Link",
            copied: "Tersalin!",
            shareBtn: "Bagikan"
        },
        en: {
            boot: "Loading Macintosh OS...",
            title: "Access Restricted",
            errorTitle: "Smartphone is not suitable for this OS.",
            errorMessage: "This portfolio is a full Desktop OS simulation. Your smartphone lacks the 'Creative Canvas' required to render the full installation.",
            errorCode: "Notice: PLEASE SWITCH TO DESKTOP/PC",
            restartBtn: "Open in Desktop",
            loadingTrans: "Preparing sync interface...",
            qrInstruction: "Scan this disk to switch to Desktop.",
            backBtn: "Back to Home",
            copyBtn: "Copy Link",
            copied: "Copied!",
            shareBtn: "Share"
        }
    }[locale];

    const handleCopy = () => {
        navigator.clipboard.writeText(siteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Ramos Portfolio',
                    text: 'Buka portfolio Ramos di Desktop untuk pengalaman OS penuh!',
                    url: siteUrl,
                });
            } catch (err) {
                console.error('Share failed', err);
            }
        } else {
            handleCopy();
        }
    };

    useEffect(() => {
        if (step === "boot") {
            const timer = setTimeout(() => setStep("error"), 2000);
            return () => clearTimeout(timer);
        }
        if (step === "details") {
            const interval = setInterval(() => {
                setProgress(p => (p < 100 ? p + 2 : p));
            }, 50);
            return () => clearInterval(interval);
        }
    }, [step]);

    return (
        <div className="fixed inset-0 z-[10000] bg-[#c0c0c0] flex items-center justify-center p-6 retro-os-container touch-none select-none overflow-hidden text-[#000]">
            <AnimatePresence mode="wait">
                {step === "boot" && (
                    <m.div
                        key="boot"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <div className="w-20 h-24 bg-white/20 rounded animate-pulse flex items-center justify-center">
                            {/* Simplified Apple Retro Logo Placeholder */}
                            <div className="flex flex-col gap-1">
                                <div className="w-12 h-2 bg-[#5EBD3E]" />
                                <div className="w-12 h-2 bg-[#FFB900]" />
                                <div className="w-12 h-2 bg-[#F78200]" />
                                <div className="w-12 h-2 bg-[#E23838]" />
                                <div className="w-12 h-2 bg-[#973999]" />
                                <div className="w-12 h-2 bg-[#009CDF]" />
                            </div>
                        </div>
                        <p className="font-bold tracking-widest text-sm uppercase">{t.boot}</p>
                    </m.div>
                )}

                {(step === "error" || step === "details") && (
                    <m.div
                        key="error-box"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="retro-window w-full max-w-[340px] shadow-2xl"
                    >
                        <div className="retro-title-bar">
                            <span className="retro-title-text">{t.title}</span>
                        </div>
                        <div className="retro-content flex flex-col items-center gap-4 text-center">
                            {step === "error" ? (
                                <>
                                    {/* Detail Error Message */}
                                    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
                                        <div className="w-16 h-16 opacity-80">
                                            <SadMacIcon />
                                        </div>

                                        <div className="text-center space-y-3 max-w-[280px]">
                                            <p className="text-[14px] leading-tight text-black font-bold uppercase tracking-tight">
                                                {locale === 'en'
                                                    ? "The desktop experience is not compatible with this device."
                                                    : "Pengalaman desktop tidak kompatibel dengan perangkat ini."}
                                            </p>
                                            <p className="text-[11px] leading-normal text-gray-700">
                                                {locale === 'en'
                                                    ? "Please switch to a desktop computer for the full interactive OS experience."
                                                    : "Silakan gunakan komputer desktop untuk pengalaman OS interaktif sepenuhnya."}
                                            </p>
                                        </div>



                                    </div>
                                    <button
                                        onClick={() => setStep("details")}
                                        className="retro-button mt-2 font-bold"
                                    >
                                        {t.restartBtn}
                                    </button>
                                </>
                            ) : (
                                <div className="w-full space-y-4">
                                    <div className="retro-progress-container">
                                        <div className="retro-progress-bar" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-[10px]">{t.loadingTrans}</p>

                                    {progress >= 100 && (
                                        <m.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white p-4 border border-black flex flex-col items-center gap-2"
                                        >
                                            {/* Interactive Floppy Disk UI */}
                                            <div
                                                onClick={handleCopy}
                                                className="w-28 h-28 bg-[#9ca3af] border-2 border-black flex flex-col items-center justify-between p-1 relative cursor-pointer active:scale-95 transition-transform"
                                            >
                                                {/* Floppy Slider */}
                                                <div className="w-full bg-[#f3f4f6] h-10 border border-black p-1 flex items-center justify-center">
                                                    <QRCodeSVG value={siteUrl} size={32} level="L" />
                                                </div>
                                                {/* Label */}
                                                <div className="flex-1 w-full bg-white border border-black mt-1 p-1 flex items-center justify-center">
                                                    <span className="text-[8px] font-bold text-center uppercase tracking-tighter">PORTORAMOS<br />DISK 1</span>
                                                </div>
                                                {/* Write Protect Notch */}
                                                <div className="absolute top-0 right-0 w-4 h-4 bg-gray-600 border-l-2 border-b-2 border-black" />
                                            </div>

                                            <p className="text-[10px] font-bold mt-1 uppercase">{t.qrInstruction}</p>

                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={handleCopy}
                                                    className="retro-button flex-1 text-[10px] py-1"
                                                >
                                                    {copied ? t.copied : t.copyBtn}
                                                </button>
                                                <button
                                                    onClick={handleShare}
                                                    className="retro-button flex-1 text-[10px] py-1"
                                                >
                                                    {t.shareBtn}
                                                </button>
                                            </div>

                                            <Link href="/" className="text-[10px] underline mt-1">{t.backBtn}</Link>
                                        </m.div>
                                    )}
                                </div>
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
