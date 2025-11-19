'use client';

import { useState } from 'react';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import type { AboutData } from '@/types/about';
import type { ExperienceData } from '@/types/experience';
import AboutClient from '@/app/about/AboutClient';

type Props = {
  initialAboutData?: AboutData | null;
  initialExperienceData?: ExperienceData | null;
};

export default function AboutClientWithAutoUpdate({
  initialAboutData,
  initialExperienceData
}: Props) {
  const [clientInitialAbout] = useState<AboutData | null>(initialAboutData ?? null);
  const [clientInitialExperience] = useState<ExperienceData | null>(initialExperienceData ?? null);

  // Auto-update data (lebih jarang karena konten jarang berubah)
  const { data: updatedAboutData } = useAutoUpdate<AboutData>(
    async () => {
      const response = await fetch('/api/about');
      if (!response.ok) throw new Error('Failed to fetch about data');
      return response.json();
    },
    { interval: 60000, enabled: false }
  );

  const aboutData = updatedAboutData || clientInitialAbout;

  if (!aboutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load about content</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AboutClient initialData={aboutData} initialExperience={clientInitialExperience ?? undefined} />
    </div>
  );
}
