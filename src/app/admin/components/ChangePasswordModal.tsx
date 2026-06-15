'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, KeyRound, ShieldCheck, AlertCircle, Eye, EyeOff, Smartphone } from 'lucide-react';
import { useCsrfToken } from '@/hooks/useCsrfToken';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'password' | 'pin'>('password');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Form, 2: Polling, 3: OTP, 4: Rejected

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // State untuk toggle hide/show password / PIN
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const csrfToken = useCsrfToken();

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200' };

    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^a-zA-Z\d]/.test(pass)) score += 1;

    if (score <= 1 || pass.length < 8)
      return { score: 1, label: 'Lemah', color: 'bg-red-500', width: '33.33%' };
    if (score === 2 || score === 3)
      return { score: 2, label: 'Sedang', color: 'bg-orange-500', width: '66.66%' };
    return { score: 3, label: 'Sangat Kuat', color: 'bg-[#00AA5B]', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Polling Effect
  useEffect(() => {
    if (step !== 2) return;

    const pollStatus = async () => {
      try {
        const url =
          activeTab === 'password' ? '/api/admin/password/otp-status' : '/api/admin/pin/otp-status';
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'approved') {
          setStep(3);
        } else if (data.status === 'rejected') {
          setStep(4);
        } else if (data.status === 'expired') {
          setError('Sesi persetujuan telah kadaluarsa.');
          setStep(1);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const intervalId = setInterval(pollStatus, 2000);
    return () => clearInterval(intervalId);
  }, [step, activeTab]);

  if (!isOpen || !mounted) return null;

  const resetState = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNewPin('');
    setConfirmPin('');
    setOtpCode('');
    setStep(1);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'password') {
      if (newPassword !== confirmPassword) {
        setError('Sandi baru dan konfirmasi sandi tidak cocok.');
        return;
      }

      if (newPassword.length < 8) {
        setError('Sandi baru harus minimal 8 karakter.');
        return;
      }
    } else {
      if (newPin !== confirmPin) {
        setError('PIN baru dan konfirmasi PIN tidak cocok.');
        return;
      }

      if (!/^\d{4}$/.test(newPin)) {
        setError('PIN baru harus berupa 4 digit angka.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const url =
        activeTab === 'password' ? '/api/admin/password/otp-request' : '/api/admin/pin/otp-request';

      const payload =
        activeTab === 'password' ? { oldPassword, newPassword } : { oldPassword, newPin };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim peringatan');
      }

      setStep(2); // Lanjut ke mode Polling
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otpCode.length !== 6) {
      setError('Kode OTP harus 6 digit angka.');
      return;
    }

    setIsLoading(true);

    try {
      const url = activeTab === 'password' ? '/api/admin/password' : '/api/admin/pin';
      const payload =
        activeTab === 'password'
          ? { oldPassword, newPassword, otpCode }
          : { oldPassword, newPin, otpCode };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || (activeTab === 'password' ? 'Gagal mengubah sandi' : 'Gagal mengubah PIN')
        );
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className="animate-in fade-in zoom-in-95 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <ShieldCheck size={18} />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Keamanan</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            disabled={isLoading || success}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
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
          ) : step === 1 ? (
            <div className="animate-in fade-in slide-in-from-left-4 space-y-4">
              {/* Tab Switcher */}
              <div className="mb-2 flex border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActiveTab('password');
                  }}
                  className={`flex-1 border-b-2 pb-3 text-center text-sm font-medium transition-all duration-150 ${
                    activeTab === 'password'
                      ? 'border-blue-600 font-semibold text-blue-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Ubah Sandi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setActiveTab('pin');
                  }}
                  className={`flex-1 border-b-2 pb-3 text-center text-sm font-medium transition-all duration-150 ${
                    activeTab === 'pin'
                      ? 'border-blue-600 font-semibold text-blue-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Ubah PIN
                </button>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <p className="text-xs leading-relaxed text-gray-500">
                  {activeTab === 'password'
                    ? 'Ubah sandi admin Anda. Untuk keamanan, kode OTP akan dikirim ke Telegram Anda sebelum sandi disimpan.'
                    : 'Ubah PIN console admin Anda. PIN harus berupa 4 digit angka. OTP akan dikirim ke Telegram Anda.'}
                </p>

                {error && (
                  <div className="animate-in slide-in-from-top-2 flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-red-600">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Sandi Lama */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Sandi Lama</label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type={showOld ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 placeholder-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Masukkan sandi saat ini"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOld(!showOld)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {activeTab === 'password' ? (
                  <>
                    {/* Password Tab Fields */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Sandi Baru</label>
                      <div className="relative">
                        <KeyRound
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 placeholder-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Minimal 8 karakter"
                          required
                          disabled={isLoading}
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {/* Password Strength Indicator */}
                      {newPassword.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-1 mt-2">
                          <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`}
                              style={{ width: '33.33%' }}
                            />
                            <div
                              className={`h-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`}
                              style={{ width: '33.33%' }}
                            />
                            <div
                              className={`h-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`}
                              style={{ width: '33.33%' }}
                            />
                          </div>
                          <p
                            className={`mt-1.5 text-xs font-medium ${
                              strength.score === 1
                                ? 'text-red-500'
                                : strength.score === 2
                                  ? 'text-orange-500'
                                  : 'text-[#00AA5B]'
                            }`}
                          >
                            Kekuatan: {strength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Konfirmasi Sandi Baru
                      </label>
                      <div className="relative">
                        <KeyRound
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 placeholder-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Ulangi sandi baru"
                          required
                          disabled={isLoading}
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* PIN Tab Fields */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        PIN Baru (4 Digit)
                      </label>
                      <div className="relative">
                        <KeyRound
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type={showNewPin ? 'text' : 'password'}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 placeholder-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Masukkan 4 digit angka"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPin(!showNewPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPin ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Konfirmasi PIN Baru
                      </label>
                      <div className="relative">
                        <KeyRound
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type={showConfirmPin ? 'text' : 'password'}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 placeholder-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Ulangi 4 digit angka"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPin(!showConfirmPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPin ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      !oldPassword ||
                      (activeTab === 'password'
                        ? !newPassword || !confirmPassword || strength.score < 1
                        : newPin.length !== 4 || confirmPin.length !== 4)
                    }
                    className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-medium font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                  >
                    {isLoading ? 'Memverifikasi...' : 'Lanjut Verifikasi OTP'}
                  </button>
                </div>
              </form>
            </div>
          ) : step === 2 ? (
            <div className="animate-in fade-in slide-in-from-right-4 flex flex-col items-center justify-center py-10 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75"></div>
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Smartphone size={32} className="animate-pulse" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Menunggu Konfirmasi...</h3>
              <p className="mt-2 max-w-xs text-sm font-normal leading-relaxed text-gray-500">
                Peringatan telah dikirim ke Telegram Admin. Silakan periksa pesan Anda dan klik
                "Iya, Ini Saya" untuk mendapatkan OTP.
              </p>
              <button
                onClick={() => setStep(1)}
                className="mt-6 text-sm text-gray-400 underline hover:text-gray-600"
              >
                Batalkan
              </button>
            </div>
          ) : step === 4 ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wide text-red-600">
                Akses Digagalkan
              </h3>
              <p className="mt-3 max-w-sm rounded-r-lg border-l-2 border-red-500 bg-red-50 p-3 text-sm font-normal leading-relaxed text-gray-600">
                Kamu terdeteksi bukan pemilik asli, akses ganti{' '}
                {activeTab === 'password' ? 'password' : 'PIN'} digagalkan! Sesi kamu telah direkam.
              </p>
              <button
                onClick={handleClose}
                className="mt-8 flex w-full items-center justify-center rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 active:scale-[0.98]"
              >
                Tutup Peringatan
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleVerifyOtp}
              className="animate-in fade-in slide-in-from-right-4 space-y-4"
            >
              <div className="mb-6 flex flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <Smartphone size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Verifikasi 2 Langkah</h3>
                <p className="mt-1 text-sm font-normal leading-relaxed text-gray-500">
                  Kode 6-digit (OTP) telah dikirim ke Telegram Anda. Kode akan kadaluarsa dalam 5
                  menit.
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
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // Hanya izinkan angka
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
                  className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-medium font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                  {isLoading
                    ? 'Mengecek...'
                    : activeTab === 'password'
                      ? 'Verifikasi & Simpan Sandi'
                      : 'Verifikasi & Simpan PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                  Kembali
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
