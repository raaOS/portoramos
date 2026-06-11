'use client';

import React from 'react';
import { LayoutPersistenceProvider } from '../contexts/LayoutPersistenceContext';
import { UnifiedZIndexProvider } from '../context/UnifiedZIndexContext';
import { DesktopWindowProvider } from '../context/DesktopWindowContext';
import DesktopErrorBoundary from '../windows/DesktopErrorBoundary';
import { WindowState } from '@/components/os/hooks/useWindowManager';
import { AboutData } from '@/types/about';

interface DesktopProvidersProps {
  children: React.ReactNode;
  initialWindows: WindowState[];
  aboutData: AboutData | null | undefined;
  csrfToken?: string;
  isAdmin: boolean;
}

export default function DesktopProviders({
  children,
  initialWindows,
  aboutData,
  csrfToken,
  isAdmin,
}: DesktopProvidersProps) {
  return (
    <DesktopErrorBoundary isAdmin={isAdmin}>
      <LayoutPersistenceProvider>
        <UnifiedZIndexProvider>
          <DesktopWindowProvider
            initialWindows={initialWindows}
            aboutData={aboutData}
            csrfToken={csrfToken}
            isAdmin={isAdmin}
          >
            {children}
          </DesktopWindowProvider>
        </UnifiedZIndexProvider>
      </LayoutPersistenceProvider>
    </DesktopErrorBoundary>
  );
}
