"use client";

import React from "react";
import { LayoutPersistenceProvider } from "../contexts/LayoutPersistenceContext";
import { UnifiedZIndexProvider } from "../context/UnifiedZIndexContext";
import { DesktopWindowProvider } from "../context/DesktopWindowContext";
import DesktopErrorBoundary from "../windows/DesktopErrorBoundary";
import { WindowState } from "@/hooks/useWindowManager";
import { AboutData } from "@/types/about";

import { OSSystemProvider } from "../context/OSSystemContext";

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
  isAdmin
}: DesktopProvidersProps) {
  return (
    <DesktopErrorBoundary>
      <LayoutPersistenceProvider>
        <UnifiedZIndexProvider>
          <OSSystemProvider>
            <DesktopWindowProvider
              initialWindows={initialWindows}
              aboutData={aboutData}
              csrfToken={csrfToken}
              isAdmin={isAdmin}
            >
              {children}
            </DesktopWindowProvider>
          </OSSystemProvider>
        </UnifiedZIndexProvider>
      </LayoutPersistenceProvider>
    </DesktopErrorBoundary>
  );
}
