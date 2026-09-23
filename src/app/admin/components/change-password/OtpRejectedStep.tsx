'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface OtpRejectedStepProps {
  activeTab: 'password' | 'pin';
  onClose: () => void;
}

export function OtpRejectedStep({ activeTab, onClose }: OtpRejectedStepProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertCircle size={40} />
      </div>
      <h3 className="text-xl font-bold uppercase tracking-wide text-red-600">Akses Digagalkan</h3>
      <p className="mt-3 max-w-sm rounded-r-lg border-l-2 border-red-500 bg-red-50 p-3 text-sm font-normal leading-relaxed text-gray-600">
        Kamu terdeteksi bukan pemilik asli, akses ganti{' '}
        {activeTab === 'password' ? 'password' : 'PIN'} digagalkan! Sesi kamu telah direkam.
      </p>
      <button
        onClick={onClose}
        className="mt-8 flex w-full items-center justify-center rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 active:scale-[0.98]"
      >
        Tutup Peringatan
      </button>
    </div>
  );
}
