'use client';

import React from 'react';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';
import { PasswordField } from './PasswordField';
import { StrengthBar } from './StrengthBar';
import type { PasswordStrength } from './changePasswordUtils';

interface FormStepProps {
  activeTab: 'password' | 'pin';
  onChangeTab: (tab: 'password' | 'pin') => void;
  oldPassword: string;
  onChangeOldPassword: (value: string) => void;
  newPassword: string;
  onChangeNewPassword: (value: string) => void;
  confirmPassword: string;
  onChangeConfirmPassword: (value: string) => void;
  newPin: string;
  onChangeNewPin: (value: string) => void;
  confirmPin: string;
  onChangeConfirmPin: (value: string) => void;
  showOld: boolean;
  onToggleShowOld: () => void;
  showNew: boolean;
  onToggleShowNew: () => void;
  showConfirm: boolean;
  onToggleShowConfirm: () => void;
  showNewPin: boolean;
  onToggleShowNewPin: () => void;
  showConfirmPin: boolean;
  onToggleShowConfirmPin: () => void;
  strength: PasswordStrength;
  isLoading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChangePasswordFormStep({
  activeTab,
  onChangeTab,
  oldPassword,
  onChangeOldPassword,
  newPassword,
  onChangeNewPassword,
  confirmPassword,
  onChangeConfirmPassword,
  newPin,
  onChangeNewPin,
  confirmPin,
  onChangeConfirmPin,
  showOld,
  onToggleShowOld,
  showNew,
  onToggleShowNew,
  showConfirm,
  onToggleShowConfirm,
  showNewPin,
  onToggleShowNewPin,
  showConfirmPin,
  onToggleShowConfirmPin,
  strength,
  isLoading,
  error,
  onSubmit,
}: FormStepProps) {
  return (
    <div className="animate-in fade-in slide-in-from-left-4 space-y-4">
      {/* Tab Switcher */}
      <div className="mb-2 flex border-b border-gray-100">
        <button
          type="button"
          onClick={() => {
            onChangeTab('password');
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
            onChangeTab('pin');
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

      <form onSubmit={onSubmit} className="space-y-4">
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
        <PasswordField
          label="Sandi Lama"
          value={oldPassword}
          onChange={onChangeOldPassword}
          show={showOld}
          onToggleShow={onToggleShowOld}
          placeholder="Masukkan sandi saat ini"
          icon={<Lock size={16} />}
          disabled={isLoading}
        />

        {activeTab === 'password' ? (
          <>
            <div className="space-y-1.5">
              <PasswordField
                label="Sandi Baru"
                value={newPassword}
                onChange={onChangeNewPassword}
                show={showNew}
                onToggleShow={onToggleShowNew}
                placeholder="Minimal 8 karakter"
                icon={<KeyRound size={16} />}
                disabled={isLoading}
                minLength={8}
              />
              <StrengthBar strength={strength} />
            </div>

            <PasswordField
              label="Konfirmasi Sandi Baru"
              value={confirmPassword}
              onChange={onChangeConfirmPassword}
              show={showConfirm}
              onToggleShow={onToggleShowConfirm}
              placeholder="Ulangi sandi baru"
              icon={<KeyRound size={16} />}
              disabled={isLoading}
              minLength={8}
            />
          </>
        ) : (
          <>
            <PasswordField
              label="PIN Baru (4 Digit)"
              value={newPin}
              onChange={onChangeNewPin}
              show={showNewPin}
              onToggleShow={onToggleShowNewPin}
              placeholder="Masukkan 4 digit angka"
              icon={<KeyRound size={16} />}
              disabled={isLoading}
              numeric
              maxLength={4}
            />

            <PasswordField
              label="Konfirmasi PIN Baru"
              value={confirmPin}
              onChange={onChangeConfirmPin}
              show={showConfirmPin}
              onToggleShow={onToggleShowConfirmPin}
              placeholder="Ulangi 4 digit angka"
              icon={<KeyRound size={16} />}
              disabled={isLoading}
              numeric
              maxLength={4}
            />
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
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? 'Memverifikasi...' : 'Lanjut Verifikasi OTP'}
          </button>
        </div>
      </form>
    </div>
  );
}
