import React from 'react';
import { loadAboutData } from '@/lib/about';
import SoundConfigLoader from '@/components/layout/SoundConfigLoader';
import LayoutClient from '@/components/layout/LayoutClient';
import PerformanceMonitor from '@/components/shared/PerformanceMonitor';
import VersionGuard from '@/components/shared/VersionGuard';
import SmoothScroll from '@/components/layout/SmoothScroll';
import NavDirectionReset from '@/components/layout/NavDirectionReset';
import { LastUpdatedProvider } from '@/contexts/LastUpdatedContext';
import { NavbarVisibilityProvider } from '@/contexts/NavbarVisibilityContext';

export default async function SiteLayout({
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const aboutData = await loadAboutData();

  return (
    <LastUpdatedProvider>
      <NavbarVisibilityProvider>
        <SmoothScroll />
        <NavDirectionReset />
        <SoundConfigLoader soundConfig={aboutData?.soundConfig} />
        <LayoutClient modal={modal} dockConfig={aboutData?.dockConfig}>
          {children}
        </LayoutClient>

        <PerformanceMonitor />
        <VersionGuard />
      </NavbarVisibilityProvider>
    </LastUpdatedProvider>
  );
}
