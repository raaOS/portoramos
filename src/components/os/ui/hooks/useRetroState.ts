'use client';

import { useState, useEffect, useCallback } from 'react';
import { soundManager } from '../../utils/SoundManager';

export function useRetroState() {
  const [step, setStep] = useState<"boot" | "error" | "details">("boot");
  const [progress, setProgress] = useState(0);
  const [locale] = useState<"id" | "en">(() => {
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

  useEffect(() => {
    if (step === "error") {
      soundManager.play('error');
    }
  }, [step]);

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

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [siteUrl]);

  const handleShare = useCallback(async () => {
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
  }, [siteUrl, handleCopy]);

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

  return {
    step,
    setStep,
    progress,
    locale,
    copied,
    siteUrl,
    handleCopy,
    handleShare,
    t
  };
}
