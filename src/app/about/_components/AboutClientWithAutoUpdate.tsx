'use client';

import { useState } from 'react';
import { useAutoUpdate } from '@/hooks/useAutoUpdate';
import type { AboutData } from '@/types/about';
import type { Project } from '@/types/projects';
import AboutClient from '@/app/about/AboutClient';

type Props = {
  initialAboutData?: AboutData | null;
  initialProjects?: Project[];
};

export default function AboutClientWithAutoUpdate({
  initialAboutData,
  initialProjects = []
}: Props) {
  // [STICKY NOTE] WRAPPER COMPONENT
  // Komponen ini bertugas sebagai "Bungkus Pelindung".
  // Fungsinya sederhana:
  // 1. Menerima data dari Server (initialAboutData).
  // 2. [Optional] Mengecek update data baru di background (Auto-Update).
  // 3. Mengirim data yang sudah pasti aman ke komponen tampilan utama (AboutClient).
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
      <AboutClient initialData={aboutData} initialProjects={initialProjects} />
    </div>
  );
}
