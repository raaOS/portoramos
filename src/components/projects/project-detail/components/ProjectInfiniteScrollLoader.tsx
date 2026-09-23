'use client';

import React, { type RefObject } from 'react';
import { localizeText } from '@/lib/i18n/contentLocalization';
import type { Locale } from '@/contexts/LanguageContext';

interface ProjectInfiniteScrollLoaderProps {
  observerTarget: RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  locale: Locale;
}

export function ProjectInfiniteScrollLoader({
  observerTarget,
  isLoading,
  locale,
}: ProjectInfiniteScrollLoaderProps) {
  return (
    <div className="mt-10 pb-20">
      <div ref={observerTarget} className="pointer-events-none h-20 w-full" aria-hidden="true" />

      {isLoading && (
        <div className="text-center opacity-50">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-amber-500"></div>
          <p className="mt-3 whitespace-nowrap text-xs font-medium text-gray-500">
            {localizeText('Memuat karya...', locale)}
          </p>
        </div>
      )}
    </div>
  );
}
