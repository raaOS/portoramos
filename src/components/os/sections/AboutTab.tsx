'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { localizeText } from '@/lib/i18n/contentLocalization';
import type { AboutData } from '@/types/about';

interface AboutTabProps {
  aboutData: AboutData | null | undefined;
}

export const AboutTab = ({ aboutData }: AboutTabProps) => {
  const { locale, dictionary } = useLanguage();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 min-w-0 space-y-6 duration-300">
      <div>
        <h1 className="about-heading mb-2 break-words text-2xl font-bold text-black">
          {localizeText(aboutData?.hero.title || 'Fullstack Developer', locale)}
        </h1>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">
          {aboutData?.professional.bio.content
            ? localizeText(aboutData.professional.bio.content, locale)
            : dictionary.common.loading}
        </p>
      </div>

      {/* Hard Skills moved to Skillset tab */}
    </div>
  );
};
