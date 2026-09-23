'use client';

import React from 'react';
import { Smartphone, AlertCircle, Lock } from 'lucide-react';
import { digitsOnly } from './changePasswordUtils';

interface OtpVerifyStepProps {
  activeTab: 'password' | 'pin';
  otpCode: string;
  onChangeOtp: (code: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function OtpVerifyStep({
  activeTab,
  otpCode,
  onChangeOtp,
  onSubmit,
  onBack,
  isLoading,
  error,
}: OtpVerifyStepProps) {
  return (
    <form onSubmit={onSubmit} className="animate-in fade-in slide-in-from-right-4 space-y-4">
      <div className="mb-6 flex flex-col items-center justify-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Smartphone size={24} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Verifikasi 2 Langkah</h3>
        <p className="mt-1 text-sm font-normal leading-relaxed text-gray-500">
          Kode 6-digit (OTP) telah dikirim ke Telegram Anda. Kode akan kadaluarsa dalam 5 menit.
        </p>
      </div>

      {error && (
        <div className="animate-in slide-in-from-top-2 flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-red-600">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Kode OTP Telegram</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otpCode}
            onChange={(e) => onChangeOtp(digitsOnly(e.target.value))}
            className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-center text-xl tracking-[0.5em] text-gray-800 placeholder-gray-300 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="••••••"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading || otpCode.length !== 6}
          className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isLoading
            ? 'Mengecek...'
            : activeTab === 'password'
              ? 'Verifikasi & Simpan Sandi'
              : 'Verifikasi & Simpan PIN'}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          Kembali
        </button>
      </div>
    </form>
  );
}
