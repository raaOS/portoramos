'use client';

import { useState } from 'react';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import type { AboutData } from '@/types/about';
import AboutClient from '@/app/about/AboutClient';

type Props = {
  initialAboutData?: AboutData | null;
};

export default function AboutClientWithAutoUpdate({
  initialAboutData
}: Props) {
  const [clientInitialAbout] = useState<AboutData | null>(initialAboutData ?? null);

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
      <AboutClient initialData={aboutData} />
    </div>
  );
}
