'use client';

import React from 'react';
import { m } from 'motion/react';
import { Link } from 'next-view-transitions';
import { QRCodeSVG } from 'qrcode.react';
import { SadMacIcon } from './SadMacIcon';
import { markBack } from '@/lib/navigationDirection';

export const RetroBootView = ({ text }: { text: string }) => (
  <m.div
    key="boot"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex flex-col items-center gap-6"
  >
    <div className="flex h-24 w-20 animate-pulse items-center justify-center rounded bg-white/20">
      <div className="flex flex-col gap-1">
        <div className="h-2 w-12 bg-[#5EBD3E]" />
        <div className="h-2 w-12 bg-[#FFB900]" />
        <div className="h-2 w-12 bg-[#F78200]" />
        <div className="h-2 w-12 bg-[#E23838]" />
        <div className="h-2 w-12 bg-[#973999]" />
        <div className="h-2 w-12 bg-[#009CDF]" />
      </div>
    </div>
    <p className="text-sm font-bold uppercase tracking-widest">{text}</p>
  </m.div>
);

interface RetroErrorViewProps {
  locale: 'id' | 'en';
  restartBtnText: string;
  onRestart: () => void;
}

export const RetroErrorView = ({ locale, restartBtnText, onRestart }: RetroErrorViewProps) => (
  <>
    <div className="flex flex-1 flex-col items-center justify-center space-y-6 p-6">
      <div className="h-16 w-16 opacity-80">
        <SadMacIcon />
      </div>
      <div className="max-w-[280px] space-y-3 text-center">
        <p className="text-[14px] font-bold uppercase leading-tight tracking-tight text-black">
          {locale === 'en'
            ? 'The desktop experience is not compatible with this device.'
            : 'Pengalaman desktop tidak kompatibel dengan perangkat ini.'}
        </p>
        <p className="text-[11px] leading-normal text-gray-700">
          {locale === 'en'
            ? 'Please switch to a desktop computer for the full interactive OS experience.'
            : 'Silakan gunakan komputer desktop untuk pengalaman OS interaktif sepenuhnya.'}
        </p>
      </div>
    </div>
    <button onClick={onRestart} className="retro-button mt-2 font-bold">
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
  onShare,
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
        className="flex flex-col items-center gap-2 border border-black bg-white p-4"
      >
        <div
          onClick={onCopy}
          className="relative flex h-28 w-28 cursor-pointer flex-col items-center justify-between border-2 border-black bg-[#9ca3af] p-1 transition-transform active:scale-95"
        >
          <div className="flex h-10 w-full items-center justify-center border border-black bg-[#f3f4f6] p-1">
            <QRCodeSVG value={siteUrl} size={32} level="L" />
          </div>
          <div className="mt-1 flex w-full flex-1 items-center justify-center border border-black bg-white p-1">
            <span className="text-center text-[8px] font-bold uppercase tracking-tighter">
              PORTORAMOS
              <br />
              DISK 1
            </span>
          </div>
          <div className="absolute right-0 top-0 h-4 w-4 border-b-2 border-l-2 border-black bg-gray-600" />
        </div>

        <p className="mt-1 text-[10px] font-bold uppercase">{qrInstruction}</p>

        <div className="flex w-full gap-2">
          <button onClick={onCopy} className="retro-button flex-1 py-1 text-[10px]">
            {copied ? 'Copied!' : copyBtn}
          </button>
          <button onClick={onShare} className="retro-button flex-1 py-1 text-[10px]">
            {shareBtn}
          </button>
        </div>

        <Link href="/" onClickCapture={markBack} className="mt-1 text-[10px] underline">
          {backBtn}
        </Link>
      </m.div>
    )}
  </div>
);
