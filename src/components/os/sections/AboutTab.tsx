import React from 'react';
import type { AboutData } from '@/types/about';

interface AboutTabProps {
  aboutData: AboutData | null | undefined;
}

export const AboutTab = ({ aboutData }: AboutTabProps) => (
  <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
    <div>
      <h1 className="mb-2 text-2xl font-bold text-black">
        {aboutData?.hero.title || 'Fullstack Developer'}
      </h1>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
        {aboutData?.professional.bio.content || 'Loading...'}
      </p>
    </div>

    {/* Hard Skills moved to Skillset tab */}
  </div>
);
