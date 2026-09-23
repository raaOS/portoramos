'use client';

import React from 'react';
import { Smartphone } from 'lucide-react';

interface OtpPollingStepProps {
  onCancel: () => void;
}

export function OtpPollingStep({ onCancel }: OtpPollingStepProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 flex flex-col items-center justify-center py-10 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75"></div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Smartphone size={32} className="animate-pulse" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-gray-800">Menunggu Konfirmasi...</h3>
      <p className="mt-2 max-w-xs text-sm font-normal leading-relaxed text-gray-500">
        Peringatan telah dikirim ke Telegram Admin. Silakan periksa pesan Anda dan klik &quot;Iya,
        Ini Saya&quot; untuk mendapatkan OTP.
      </p>
      <button
        onClick={onCancel}
        className="mt-6 text-sm text-gray-400 underline hover:text-gray-600"
      >
        Batalkan
      </button>
    </div>
  );
}
