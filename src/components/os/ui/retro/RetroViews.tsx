'use client';

import React from 'react';
import { m } from 'motion/react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { SadMacIcon } from './SadMacIcon';

export const RetroBootView = ({ text }: { text: string }) => (
    <m.div
        key="boot"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center gap-6"
    >
        <div className="w-20 h-24 bg-white/20 rounded animate-pulse flex items-center justify-center">
            <div className="flex flex-col gap-1">
                <div className="w-12 h-2 bg-[#5EBD3E]" />
                <div className="w-12 h-2 bg-[#FFB900]" />
                <div className="w-12 h-2 bg-[#F78200]" />
                <div className="w-12 h-2 bg-[#E23838]" />
                <div className="w-12 h-2 bg-[#973999]" />
                <div className="w-12 h-2 bg-[#009CDF]" />
            </div>
        </div>
        <p className="font-bold tracking-widest text-sm uppercase">{text}</p>
    </m.div>
);

interface RetroErrorViewProps {
    locale: "id" | "en";
    restartBtnText: string;
    onRestart: () => void;
}

export const RetroErrorView = ({ locale, restartBtnText, onRestart }: RetroErrorViewProps) => (
    <>
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
            onClick={onRestart}
            className="retro-button mt-2 font-bold"
        >
            {restartBtnText}
        </button>
    </>
);

interface RetroDetailsViewProps {
    progress: number;
    loadingTrans: string;
    siteUrl: string;
    qrInstruction: string;
    copyBtn: string;
    shareBtn: string;
    backBtn: string;
    copied: boolean;
    onCopy: () => void;
    onShare: () => void;
}

export const RetroDetailsView = ({
    progress,
    loadingTrans,
    siteUrl,
    qrInstruction,
    copyBtn,
    shareBtn,
    backBtn,
    copied,
    onCopy,
    onShare
}: RetroDetailsViewProps) => (
    <div className="w-full space-y-4">
        <div className="retro-progress-container">
            <div className="retro-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px]">{loadingTrans}</p>

        {progress >= 100 && (
            <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 border border-black flex flex-col items-center gap-2"
            >
                <div
                    onClick={onCopy}
                    className="w-28 h-28 bg-[#9ca3af] border-2 border-black flex flex-col items-center justify-between p-1 relative cursor-pointer active:scale-95 transition-transform"
                >
                    <div className="w-full bg-[#f3f4f6] h-10 border border-black p-1 flex items-center justify-center">
                        <QRCodeSVG value={siteUrl} size={32} level="L" />
                    </div>
                    <div className="flex-1 w-full bg-white border border-black mt-1 p-1 flex items-center justify-center">
                        <span className="text-[8px] font-bold text-center uppercase tracking-tighter">PORTORAMOS<br />DISK 1</span>
                    </div>
                    <div className="absolute top-0 right-0 w-4 h-4 bg-gray-600 border-l-2 border-b-2 border-black" />
                </div>

                <p className="text-[10px] font-bold mt-1 uppercase">{qrInstruction}</p>

                <div className="flex gap-2 w-full">
                    <button onClick={onCopy} className="retro-button flex-1 text-[10px] py-1">
                        {copied ? "Copied!" : copyBtn}
                    </button>
                    <button onClick={onShare} className="retro-button flex-1 text-[10px] py-1">
                        {shareBtn}
                    </button>
                </div>

                <Link href="/" className="text-[10px] underline mt-1">{backBtn}</Link>
            </m.div>
        )}
    </div>
);
