"use client";

import dynamic from 'next/dynamic';
import type { DesktopEnvironmentProps } from './DesktopEnvironment';

// Static loading component
function DesktopLoading() {
  return (
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

// Dynamic import with loading state
const DynamicDesktop = dynamic(() => import('./DesktopEnvironment'), {
  ssr: false,
  loading: DesktopLoading,
});

// Wrapper component
export default function DesktopEnvironmentClient(props: DesktopEnvironmentProps) {
  return <DynamicDesktop {...props} />;
}
