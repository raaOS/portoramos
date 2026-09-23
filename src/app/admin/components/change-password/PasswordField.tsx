'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
  icon: React.ReactNode;
  disabled?: boolean;
  minLength?: number;
  /** Mode input numerik (untuk PIN) dengan filter digit-only */
  numeric?: boolean;
  maxLength?: number;
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-800 placeholder-gray-400 transition-shadow focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

export function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  icon,
  disabled,
  minLength,
  numeric = false,
  maxLength,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
          className={inputClass}
          placeholder={placeholder}
          required
          disabled={disabled}
          minLength={minLength}
          {...(numeric ? { inputMode: 'numeric' as const, pattern: '[0-9]*' } : {})}
          {...(maxLength ? { maxLength } : {})}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
