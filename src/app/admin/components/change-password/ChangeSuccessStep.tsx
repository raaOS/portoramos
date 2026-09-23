'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ChangeSuccessStepProps {
  activeTab: 'password' | 'pin';
}

export function ChangeSuccessStep({ activeTab }: ChangeSuccessStepProps) {
  return (
    <div className="animate-in slide-in-from-bottom-4 flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <ShieldCheck size={32} />
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-800">
        {activeTab === 'password' ? 'Sandi Berhasil Diubah!' : 'PIN Berhasil Diubah!'}
      </h3>
      <p className="text-sm text-gray-500">
        {activeTab === 'password'
          ? 'Sandi admin Anda telah diperbarui dengan aman menggunakan OTP 2FA.'
          : 'PIN admin Anda telah diperbarui dengan aman menggunakan OTP 2FA.'}
      </p>
    </div>
  );
}
