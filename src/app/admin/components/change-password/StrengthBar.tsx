'use client';

import React from 'react';
import type { PasswordStrength } from './changePasswordUtils';

interface StrengthBarProps {
  strength: PasswordStrength;
}

export function StrengthBar({ strength }: StrengthBarProps) {
  if (strength.score === 0) return null;

  return (
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
  );
}
