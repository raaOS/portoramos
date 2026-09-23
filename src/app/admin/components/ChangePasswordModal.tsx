'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck } from 'lucide-react';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import { OtpPollingStep } from './change-password/OtpPollingStep';
import { OtpRejectedStep } from './change-password/OtpRejectedStep';
import { OtpVerifyStep } from './change-password/OtpVerifyStep';
import { ChangeSuccessStep } from './change-password/ChangeSuccessStep';
import { ChangePasswordFormStep } from './change-password/ChangePasswordFormStep';
import {
  getPasswordStrength,
  validateOtpRequest,
  validateOtpCode,
} from './change-password/changePasswordUtils';

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

    const validationError = validateOtpRequest(activeTab, {
      newPassword,
      confirmPassword,
      newPin,
      confirmPin,
    });

    if (validationError) {
      setError(validationError);
      return;
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

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateOtpCode(otpCode);
    if (validationError) {
      setError(validationError);
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

  const handleChangeTab = (tab: 'password' | 'pin') => {
    setError(null);
    setActiveTab(tab);
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
            <ChangeSuccessStep activeTab={activeTab} />
          ) : step === 1 ? (
            <ChangePasswordFormStep
              activeTab={activeTab}
              onChangeTab={handleChangeTab}
              oldPassword={oldPassword}
              onChangeOldPassword={setOldPassword}
              newPassword={newPassword}
              onChangeNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              onChangeConfirmPassword={setConfirmPassword}
              newPin={newPin}
              onChangeNewPin={setNewPin}
              confirmPin={confirmPin}
              onChangeConfirmPin={setConfirmPin}
              showOld={showOld}
              onToggleShowOld={() => setShowOld(!showOld)}
              showNew={showNew}
              onToggleShowNew={() => setShowNew(!showNew)}
              showConfirm={showConfirm}
              onToggleShowConfirm={() => setShowConfirm(!showConfirm)}
              showNewPin={showNewPin}
              onToggleShowNewPin={() => setShowNewPin(!showNewPin)}
              showConfirmPin={showConfirmPin}
              onToggleShowConfirmPin={() => setShowConfirmPin(!showConfirmPin)}
              strength={strength}
              isLoading={isLoading}
              error={error}
              onSubmit={handleRequestOtp}
            />
          ) : step === 2 ? (
            <OtpPollingStep onCancel={() => setStep(1)} />
          ) : step === 4 ? (
            <OtpRejectedStep activeTab={activeTab} onClose={handleClose} />
          ) : (
            <OtpVerifyStep
              activeTab={activeTab}
              otpCode={otpCode}
              onChangeOtp={setOtpCode}
              onSubmit={handleVerifyOtp}
              onBack={() => setStep(1)}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
